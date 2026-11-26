// The calculator: setup, memory, modifier keys, and a stack of screens.
import * as N from '../core/num.js';
import * as V from '../core/values.js';
import { formatReal, complexFractionModel } from '../core/format.js';
import { pack, unpack } from '../core/serialize.js';
import { resolveKey } from './keymap.js';
import { setLanguage } from './i18n.js';

export const DEFAULT_SETUP = Object.freeze({
  io: 'mm',                 // mm MathI/MathO, md MathI/DecimalO, ll LineI/LineO, ld LineI/DecimalO
  angle: 'deg',
  numFormat: { mode: 'norm', digits: 1 },
  engSymbol: false,
  fracResult: 'improper',   // 'mixed' = ab/c, 'improper' = d/c
  complexForm: 'rect',      // 'rect' a+bi, 'polar' r∠θ
  statFreq: false,
  sheetAutoCalc: true,
  sheetShowCell: 'formula',
  eqComplex: true,
  table: 'fg',              // 'f' = f(x), 'fg' = f(x),g(x)
  digitSep: false,
  multiLineFont: 'normal',
  qr: 11,
  contrast: 5,
  language: 'en',
});

// keys that always act globally (the screens below never see them)
const DIRECT = new Set(['setup', 'reset', 'qr', 'variable', 'function', 'catalog', 'format']);

export const VAR_NAMES = ['A', 'B', 'C', 'D', 'E', 'F', 'x', 'y', 'z'];
const STORAGE_KEY = 'fx991cw.state.v1';

export class Calculator {
  /** modes: registry { id: { start(calc) → Screen } }, view: { render(calc) } */
  constructor({ modes, storage, onChange }) {
    this.modes = modes;
    this.storage = storage;
    this.onChange = onChange || (() => {});
    this.setup = structuredClone(DEFAULT_SETUP);
    this.mem = { vars: {}, ans: N.ZERO, mats: {}, vcts: {}, funcs: { f: [], g: [] } };
    this.mode = 'calc';
    this.shift = false;
    this.alpha = false;
    this.power = true;
    this.screens = [];
    this.load();
    this.setup.language = setLanguage(this.setup.language);
    this.enterMode(this.mode);
  }

  // ------------------------------------------------------------ screens

  get top() { return this.screens[this.screens.length - 1]; }
  push(screen) { this.screens.push(screen); }
  pop() { if (this.screens.length > 1) this.screens.pop(); }
  replace(screen) { this.screens[this.screens.length - 1] = screen; }
  /** Pops screens until `screen` is on top. */
  popTo(screen) { while (this.screens.length > 1 && this.top !== screen) this.screens.pop(); }

  enterMode(mode) {
    this.mode = mode;
    this.screens = [];
    this.modeData = {};
    this.modes[mode].start(this);
    this.save();
  }

  /** A setup item changed: screens that depend on it react (e.g. I/O change clears history). */
  notify(what) {
    for (const s of this.screens) s.onSetup?.(what);
    this.modeData.onSetup?.(what);
  }

  // ------------------------------------------------------------ keys

  press(key) {
    if (!this.power) {
      if (key === 'ON') { this.power = true; this.enterMode(this.mode); }
      this.onChange();
      return;
    }
    if (key === 'SHIFT') { this.shift = !this.shift; this.alpha = false; this.onChange(); return; }
    const ev = { key, shift: this.shift, alpha: false, action: resolveKey(key, { shift: this.shift, mode: this.mode }) };
    this.shift = false;
    this.alpha = false;
    if (ev.action === 'on') {
      this.enterMode(this.mode);
    } else if (ev.action === 'off') {
      this.power = false;
      this.save();
    } else if (ev.action === 'home') {
      this.goHome();
    } else if (DIRECT.has(ev.action)) {
      this.globalAction(ev);
    } else if (ev.action === 'back' && !this.top.handlesBack) {
      if (this.screens.length > 1) this.pop();
      else this.top.handle({ ...ev, action: 'ac' });
    } else if ((ev.action === 'pgup' || ev.action === 'pgdn') && !this.top.handlesPage) {
      this.top.handle({ ...ev, action: ev.action === 'pgup' ? 'up' : 'down' });
    } else if (!this.top.handle(ev)) {
      this.globalAction(ev);
    }
    this.save();
    this.onChange();
  }

  /** HOME: the app list on top of the current app (BACK/AC return to it). */
  goHome() {
    if (this.top?.isHome) return;
    // like the real calculator, HOME leaves the current app's menus
    while (this.screens.length > 1 && this.top.isMenu) this.screens.pop();
    this.push(this.modes.$menus.mainMenu(this));
  }

  globalAction(ev) {
    const m = this.modes.$menus;
    switch (ev.action) {
      case 'menu': this.goHome(); break;
      case 'setup': this.push(m.setupMenu(this)); break;
      case 'reset': this.push(m.resetMenu(this)); break;
      case 'qr': this.push(m.qrScreen(this)); break;
      case 'variable': this.push(m.variableScreen(this)); break;
      case 'function': this.push(m.functionMenu(this)); break;
      case 'catalog': this.push(m.catalogMenu(this)); break;
      case 'optn': this.push(m.toolsMenu(this)); break;
      case 'format': m.formatKey(this); break;
      case 'pgup': this.top.handle({ ...ev, action: 'up' }); break;
      case 'pgdn': this.top.handle({ ...ev, action: 'down' }); break;
      case 'back': if (this.screens.length > 1) this.pop(); break;
      default: break;
    }
  }

  // ------------------------------------------------------------ evaluation context and formatting

  ctx(extra = {}) {
    return {
      angle: this.setup.angle,
      complex: this.mode === 'cmplx',
      baseMode: this.mode === 'base' ? this.modeData.base || 'dec' : null,
      numFormat: this.setup.numFormat,
      vars: this.mem.vars,
      ans: this.mem.ans,
      mats: this.mem.mats,
      vcts: this.mem.vcts,
      funcs: this.mem.funcs,
      stats: this.modeData.stats ? this.modeData.stats() : null,
      setVar: (name, v) => { this.mem.vars[name] = v; },
      ...extra,
    };
  }

  /** Display model for a real or complex value. view: { form, mixed, eng, polar } */
  model(v, view = {}) {
    if (V.isCx(v) || (this.mode === 'cmplx' && (view.polar || this.setup.complexForm === 'polar') && V.isReal(v))) {
      return this.complexModel(V.isCx(v) ? v : V.cx(v, N.ZERO), view);
    }
    return formatReal(v, this.setup, view);
  }

  complexModel(v, view = {}) {
    const polar = view.polar ?? this.setup.complexForm === 'polar';
    if (polar) {
      const r = V.abs(v);
      const theta = V.arg(v, this.setup.angle);
      return { t: 'polar', r: formatReal(r, this.setup, view), theta: formatReal(theta, this.setup, view) };
    }
    if (this.setup.io === 'mm' && view.form !== 'dec') {
      const combined = complexFractionModel(v.re, v.im);
      if (combined) return combined;
    }
    const re = N.isZero(v.re) && !N.isZero(v.im) ? null : formatReal(v.re, this.setup, view);
    const im = N.isZero(v.im) ? null : formatReal(v.im, this.setup, view);
    return { t: 'cplx', re, im };
  }

  setAns(v) {
    this.mem.ans = v;
  }

  // ------------------------------------------------------------ persistence

  save() {
    if (!this.storage) return;
    try {
      const data = {
        setup: this.setup,
        vars: Object.fromEntries(Object.entries(this.mem.vars).map(([k, v]) => [k, pack(v)])),
        ans: pack(V.isMat(this.mem.ans) || V.isVec(this.mem.ans) ? null : this.mem.ans),
        mats: Object.fromEntries(Object.entries(this.mem.mats).map(([k, v]) => [k, pack(v)])),
        vcts: Object.fromEntries(Object.entries(this.mem.vcts).map(([k, v]) => [k, pack(v)])),
        funcs: this.mem.funcs,
      };
      this.storage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // storage unavailable: memory simply isn't kept between sessions
    }
  }

  load() {
    if (!this.storage) return;
    try {
      const raw = this.storage.getItem(STORAGE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);
      this.setup = { ...structuredClone(DEFAULT_SETUP), ...data.setup };
      delete this.setup.decimalMark; // setting of the international model, not on the fx-991CE X
      for (const [k, v] of Object.entries(data.vars || {})) this.mem.vars[k] = unpack(v);
      if (data.ans) this.mem.ans = unpack(data.ans);
      for (const [k, v] of Object.entries(data.mats || {})) this.mem.mats[k] = unpack(v);
      for (const [k, v] of Object.entries(data.vcts || {})) this.mem.vcts[k] = unpack(v);
      if (data.funcs) this.mem.funcs = { f: data.funcs.f || [], g: data.funcs.g || [] };
    } catch {
      // corrupt state: start fresh
    }
  }

  // ------------------------------------------------------------ RESET

  resetSetup() {
    const { contrast, language } = this.setup;
    this.setup = { ...structuredClone(DEFAULT_SETUP), contrast, language };
  }

  resetMemory() {
    this.mem = { vars: {}, ans: N.ZERO, mats: {}, vcts: {}, funcs: { f: [], g: [] } };
  }

  resetAll() {
    this.resetSetup();
    this.resetMemory();
    this.enterMode('calc');
  }
}
