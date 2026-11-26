// fx-991CW screens: HOME, SETTINGS, VARIABLE, FUNCTION, CATALOG, TOOLS and FORMAT.
import * as N from '../../core/num.js';
import * as V from '../../core/values.js';
import { formatReal, modelText } from '../../core/format.js';
import { Editor } from '../../core/editor.js';
import { h } from '../../ui/render.js';
import { LINES } from '../../ui/lcd.js';
import { Menu, closeMenus } from './menu.js';
import { Message, Confirm, DigitPrompt, page, item } from './common.js';
import { KEY_OF_VARIABLE } from '../keymap.js';
import { LANGUAGES } from '../i18n.js';
import { FuncInput } from '../modes/table.js';

// ---------------------------------------------------------------- HOME

export const APPS = [
  { id: 'calc', label: 'Calculate' },
  { id: 'stat', label: 'Statistics' },
  { id: 'dist', label: 'Distribution' },
  { id: 'sheet', label: 'Spreadsheet' },
  { id: 'table', label: 'Table' },
  { id: 'eqn', label: 'Equation' },
  { id: 'ineq', label: 'Inequality' },
  { id: 'cmplx', label: 'Complex' },
  { id: 'base', label: 'Base-N' },
  { id: 'matrix', label: 'Matrix' },
  { id: 'vector', label: 'Vector' },
  { id: 'ratio', label: 'Ratio' },
  { id: 'mathbox', label: 'Math Box' },
];

// small pictograms above the app names ('#' = dot)
const PICT = {
  calc: ['..#.......#..', '.###....###..', '..#..........', '..........#..', '#.#.....#####', '.#...........', '#.#.......#..'],
  stat: ['#............', '#.........##.', '#.....##..##.', '#.##..##..##.', '#.##..##..##.', '#.##..##..##.', '#############'],
  dist: ['.....###.....', '....#...#....', '...#.....#...', '..#.......#..', '.#.........#.', '#...........#', '#############'],
  sheet: ['#############', '#...#...#...#', '#############', '#...#...#...#', '#############', '#...#...#...#', '#############'],
  table: ['#############', '#.##.#.##.##.', '#############', '#..#.#..#.#..', '#..#.#..#.#..', '#..#.#..#.#..', '#############'],
  mathbox: ['#######.......', '#.....#.#####.', '#.#...#.#...#.', '#..#..#.#.#.#.', '#...#.#.#...#.', '#.....#.#####.', '#######.......'],
};
const PICT_TEXT = { eqn: 'xy=0', ineq: 'xy>0', cmplx: 'a+bi', base: '2 8 16', matrix: '[::]', vector: '[ v ]', ratio: 'a:b' };

/** Draws text with one pixel less spacing when it would not fit the 64-px cell. */
function tightText(lcd, text, cx, base, font = 'S') {
  const normal = text.length * 6;
  const tight = normal > 62;
  const w = tight ? text.length * 5 + 1 : normal - 1;
  let x = Math.round(cx - w / 2);
  const x0 = x;
  for (const c of text) x += lcd.glyph(c, x, base, font) - (tight ? 1 : 0);
  return { x0, w };
}

class HomeScreen {
  constructor(calc) {
    this.calc = calc;
    this.isMenu = true;
    this.isHome = true;
    this.handlesBack = true;
    this.handlesPage = true;
    this.sel = Math.max(0, APPS.findIndex((a) => a.id === calc.mode));
    this.row = Math.max(0, Math.floor(this.sel / 3) - 0);
    this.fix();
  }

  fix() {
    const r = Math.floor(this.sel / 3);
    if (r < this.row) this.row = r;
    if (r > this.row + 1) this.row = r - 1;
    this.row = Math.min(this.row, Math.ceil(APPS.length / 3) - 2);
  }

  handle(ev) {
    const n = APPS.length;
    switch (ev.action) {
      case 'left': this.sel = (this.sel - 1 + n) % n; break;
      case 'right': this.sel = (this.sel + 1) % n; break;
      case 'up': this.sel = this.sel - 3 >= 0 ? this.sel - 3 : Math.min(n - 1, this.sel + 3 * Math.floor((n - 1 - this.sel) / 3)); break;
      case 'down': this.sel = this.sel + 3 < n ? this.sel + 3 : this.sel % 3; break;
      case 'pgup': this.sel = Math.max(this.sel % 3, this.sel - 6); break;
      case 'pgdn': this.sel = Math.min(n - 1, this.sel + 6); break;
      case 'eq': this.calc.enterMode(APPS[this.sel].id); return true;
      case 'ac': case 'back': if (this.calc.screens.length > 1) this.calc.pop(); return true;
      default: return true;
    }
    this.fix();
    return true;
  }

  view() { return { el: h('div', 'menu', h('div', 'item', APPS[this.sel].label)), status: { bare: true } }; }

  /** Three apps per row, two rows on screen: a pictogram above each name, the selected name inverted. */
  paint(lcd) {
    for (let k = 0; k < 6; k++) {
      const i = this.row * 3 + k;
      const app = APPS[i];
      if (!app) break;
      const cx = 32 + (k % 3) * 64;
      const top = Math.floor(k / 3) * 32;
      const p = PICT[app.id];
      if (p) lcd.bitmap(p, Math.round(cx - p[0].length / 2), top + 3);
      else {
        const txt = PICT_TEXT[app.id];
        tightText(lcd, txt, cx, top + 10);
      }
      const { x0, w } = tightText(lcd, app.label, cx, top + 23);
      if (i === this.sel) lcd.invert(Math.max(0, x0 - 2), top + 14, Math.min(w + 4, 192 - Math.max(0, x0 - 2)), 12);
    }
    const rows = Math.ceil(APPS.length / 3);
    // scroll bar on the right edge
    lcd.fill(191, 0, 1, 63);
    const t0 = Math.round((this.row * 63) / rows), t1 = Math.round(((this.row + 2) * 63) / rows);
    lcd.fill(190, t0, 2, t1 - t0);
    return { only: true, up: this.row > 0, down: this.row + 2 < rows };
  }
}

export const mainMenu = (calc) => new HomeScreen(calc);

// ---------------------------------------------------------------- SETTINGS

/** A list of options with radio buttons; choosing one returns to the item list. */
function choose(calc, key, options, after, title) {
  const m = new Menu(calc, [page(options.map(([label, value]) => item(label, () => {
    calc.setup[key] = value;
    calc.pop();
    after?.(calc);
  }, { radio: JSON.stringify(calc.setup[key]) === JSON.stringify(value) })))], { sub: true, title });
  m.select(Math.max(0, options.findIndex(([, v]) => JSON.stringify(calc.setup[key]) === JSON.stringify(v))));
  return m;
}

const onOff = [['On', true], ['Off', false]];
const more = { more: true };

function numberFormatMenu(calc) {
  const nf = calc.setup.numFormat;
  const set = (v) => { calc.setup.numFormat = v; closeMenus(calc); calc.push(setupMenu(calc)); };
  return new Menu(calc, [page([
    item('Fix', () => calc.push(new DigitPrompt(calc, 'Fix 0~9?', 0, 9, (d) => set({ mode: 'fix', digits: d }))), { radio: nf.mode === 'fix' }),
    item('Sci', () => calc.push(new DigitPrompt(calc, 'Sci 0~9?', 0, 9, (d) => set({ mode: 'sci', digits: d }))), { radio: nf.mode === 'sci' }),
    item('Norm 1', () => { calc.setup.numFormat = { mode: 'norm', digits: 1 }; calc.pop(); }, { radio: nf.mode === 'norm' && nf.digits === 1 }),
    item('Norm 2', () => { calc.setup.numFormat = { mode: 'norm', digits: 2 }; calc.pop(); }, { radio: nf.mode === 'norm' && nf.digits === 2 }),
  ])], { sub: true, title: 'Number Format' });
}

function calcSettings(calc) {
  const sub = (m) => () => calc.push(m());
  return new Menu(calc, [page([
    item('Input/Output', sub(() => choose(calc, 'io', [['MathI/MathO', 'mm'], ['MathI/DecimalO', 'md'], ['LineI/LineO', 'll'], ['LineI/DecimalO', 'ld']], (c) => c.notify('io'))), more),
    item('Angle Unit', sub(() => choose(calc, 'angle', [['Degree', 'deg'], ['Radian', 'rad'], ['Gradian', 'gra']])), more),
    item('Number Format', sub(() => numberFormatMenu(calc)), more),
    item('Engineer Symbol', sub(() => choose(calc, 'engSymbol', onOff)), more),
    item('Fraction Result', sub(() => choose(calc, 'fracResult', [['Mixed Fraction', 'mixed'], ['Improp Fraction', 'improper']])), more),
    item('Complex Result', sub(() => choose(calc, 'complexForm', [['a+bi', 'rect'], ['r∠θ', 'polar']])), more),
    item('Digit Separator', sub(() => choose(calc, 'digitSep', onOff)), more),
    item('Statistics Freq', sub(() => choose(calc, 'statFreq', onOff, (c) => c.notify('statFreq'))), more),
    item('Table Type', sub(() => choose(calc, 'table', [['f(x)', 'f'], ['f(x),g(x)', 'fg']], (c) => c.notify('table'))), more),
    item('Complex Roots', sub(() => choose(calc, 'eqComplex', onOff)), more),
    item('Sheet Auto Calc', sub(() => choose(calc, 'sheetAutoCalc', onOff)), more),
    item('Sheet Show Cell', sub(() => choose(calc, 'sheetShowCell', [['Formula', 'formula'], ['Value', 'value']])), more),
  ])], { sub: true });
}

function systemSettings(calc) {
  const sub = (m) => () => calc.push(m());
  return new Menu(calc, [page([
    item('Contrast', () => calc.push(new ContrastScreen(calc)), more),
    item('MultiLine Font', sub(() => choose(calc, 'multiLineFont', [['Normal Font', 'normal'], ['Small Font', 'small']])), more),
    item('QR Code', sub(() => choose(calc, 'qr', [['Version 3', 3], ['Version 11', 11]])), more),
    item('Language', sub(() => choose(calc, 'language', LANGUAGES)), more),
  ])], { sub: true });
}

export function resetMenu(calc) {
  const done = (title) => {
    closeMenus(calc);
    calc.push(new Message(calc, [title, '', 'Press [AC] Key'], { keys: ['ac', 'eq', 'back'] }));
  };
  return new Menu(calc, [page([
    item('Settings & Data', () => calc.push(new Confirm(calc, 'Reset Settings?', () => { calc.resetSetup(); calc.mem.funcs = { f: [], g: [] }; calc.enterMode(calc.mode); done('Reset Settings'); })), more),
    item('Variable Memory', () => calc.push(new Confirm(calc, 'Clear Variables?', () => { calc.resetMemory(); done('Clear Memory'); })), more),
    item('Initialize All', () => calc.push(new Confirm(calc, 'Initialize All?', () => { calc.resetAll(); done('Initialize All'); })), more),
  ])], { sub: true });
}

export function setupMenu(calc) {
  return new Menu(calc, [page([
    item('Calc Settings', () => calc.push(calcSettings(calc)), more),
    item('System Settings', () => calc.push(systemSettings(calc)), more),
    item('Reset', () => calc.push(resetMenu(calc)), more),
    item('About', () => calc.push(new Message(calc, ['fx-991CW Emulator', 'Personal re-creation', 'Not affiliated with', 'CASIO.'], { keys: ['ac', 'eq', 'back', 'left'] }))),
  ])]);
}

class ContrastScreen {
  constructor(calc) { this.calc = calc; this.isMenu = true; }

  handle(ev) {
    if (ev.action === 'left') this.calc.setup.contrast = Math.max(1, this.calc.setup.contrast - 1);
    else if (ev.action === 'right') this.calc.setup.contrast = Math.min(9, this.calc.setup.contrast + 1);
    else if (ev.action === 'ac') closeMenus(this.calc);
    else if (ev.action === 'eq' || ev.action === 'back') this.calc.pop();
    return true;
  }

  view() { return { el: h('div', 'message', h('div', 'big', 'Contrast')) }; }

  paint(lcd) {
    const c = this.calc.setup.contrast;
    lcd.text('Contrast', 1, LINES[0]);
    lcd.text('Light', 1, LINES[1] + 2, { font: 'S' });
    lcd.textRight('Dark', 187, LINES[1] + 2, { font: 'S' });
    const x0 = 22;
    lcd.text('◀', 2, LINES[2] + 2);
    for (let i = 0; i < 9; i++) (i < c ? lcd.fill.bind(lcd) : lcd.frame.bind(lcd))(x0 + i * 16, LINES[2] - 8, 13, 10);
    lcd.textRight('▶', 187, LINES[2] + 2);
  }
}

export function qrScreen(calc) {
  const m = new Message(calc, ['QR Code', '', 'Not available in', 'this emulator.'], { keys: ['ac', 'qr', 'eq', 'back'] });
  m.isMenu = true;
  return m;
}

// ---------------------------------------------------------------- inserting into the screen below a menu

/** Returns insert(action): closes the menus opened over `target` and sends it the action. */
function inserter(calc, target) {
  return (action) => {
    calc.popTo(target);
    target.handle({ key: null, shift: false, alpha: false, action });
  };
}

// ---------------------------------------------------------------- VARIABLE

const VARS = ['A', 'B', 'C', 'D', 'E', 'F', 'x', 'y', 'z'];

function valueText(calc, v) {
  const setup = { ...calc.setup, numFormat: { mode: 'norm', digits: 1 } };
  try {
    const m = V.isCx(v) ? calc.complexModel(v, { form: 'dec' }) : formatReal(v, setup, { form: 'dec' });
    return modelText(m, { decimalMark: '.' }).replace(/×10\^/, 'E');
  } catch {
    return '0';
  }
}

export function variableScreen(calc) {
  const target = calc.top;
  const insert = inserter(calc, target);
  const items = VARS.map((n) => item(`${n}=${valueText(calc, calc.mem.vars[n] ?? N.ZERO)}`, () => calc.push(new Menu(calc, [page([
    item('Store', () => {
      calc.popTo(target);
      target.handle({ key: null, action: 'sto' });
      target.handle({ key: KEY_OF_VARIABLE[n], action: null });
    }),
    item('Recall', () => insert(`var:${n}`)),
    item('Clear', () => { calc.mem.vars[n] = N.ZERO; calc.popTo(target); calc.push(variableScreen(calc)); calc.top.select(VARS.indexOf(n)); }),
  ])], { sub: true, title: `${n}=` })), more));
  const m = new Menu(calc, [page(items)]);
  m.smallList = false;
  return m;
}

// ---------------------------------------------------------------- FUNCTION

let DefineFunctionClass = null;
function defineScreen(calc, which) {
  if (!DefineFunctionClass) DefineFunctionClass = makeDefineFunction();
  return new DefineFunctionClass(calc, which);
}
const isDefine = (s) => DefineFunctionClass && s instanceof DefineFunctionClass;

function makeDefineFunction() {
  return class DefineFunction extends FuncInput {
  constructor(calc, which) {
    super(calc, which);
    this.editor = new Editor(this.math, Editor.clone(calc.mem.funcs[which] || []));
  }

  handle(ev) {
    if (ev.action === 'eq') {
      this.calc.mem.funcs[this.which] = Editor.clone(this.editor.root);
      if (this.calc.mode === 'table') this.calc.modeData[this.which] = Editor.clone(this.editor.root);
      this.calc.pop();
      return true;
    }
    if (ev.action === 'ac') { this.editor.clear(); return true; }
    if (ev.action === 'up' || ev.action === 'optn') return true;
    return super.handle(ev);
  }
  };
}

export function functionMenu(calc) {
  const target = calc.top;
  const insert = inserter(calc, target);
  const define = (w) => () => { calc.popTo(target); calc.push(defineScreen(calc, w)); };
  const defining = isDefine(target) ? target.which : null;
  const items = [];
  if (defining !== 'f') items.push(item('f(x)', () => insert('tok:f(')));
  if (defining !== 'g') items.push(item('g(x)', () => insert('tok:g(')));
  if (!defining) items.push(item('Define f(x)', define('f'), more), item('Define g(x)', define('g'), more));
  return new Menu(calc, [page(items)]);
}

// ---------------------------------------------------------------- CATALOG

const list = (insert, pairs) => page(pairs.map(([label, action]) => item(label, () => insert(action))));

export function catalogMenu(calc) {
  const target = calc.top;
  const insert = inserter(calc, target);
  const sub = (title, pairs) => item(title, () => calc.push(new Menu(calc, [list(insert, pairs)], { sub: true })), more);
  const items = [];
  const mode = calc.mode;
  if (mode === 'cmplx' || mode === 'eqn') {
    items.push(sub('Complex', [['i', 'tok:i'], ['∠', 'tok:∠'], ['Conjugate', 'tok:Conjg('], ['Argument', 'tok:Arg('],
      ['Real Part', 'tok:ReP('], ['Imaginary Part', 'tok:ImP('], ['▸r∠θ', 'tok:►r∠θ'], ['▸a+bi', 'tok:►a+bi']]));
  }
  if (mode === 'base') {
    items.push(sub('Hex Value', ['A', 'B', 'C', 'D', 'E', 'F'].map((x) => [x, `hex:${x}`])));
    items.push(sub('Base Prefix', [['Decimal(d)', 'tok:based'], ['Hexadecimal(h)', 'tok:baseh'], ['Binary(b)', 'tok:baseb'], ['Octal(o)', 'tok:baseo']]));
    items.push(sub('Logic Operation', [['and', 'tok:and'], ['or', 'tok:or'], ['xor', 'tok:xor'], ['xnor', 'tok:xnor'], ['Not', 'tok:Not('], ['Neg', 'tok:Neg(']]));
  }
  const APP_OPTN = { stat: 'Statistics', matrix: 'Matrix', vector: 'Vector', sheet: 'Spreadsheet', table: 'Table', dist: 'Distribution' };
  if (APP_OPTN[mode]) {
    items.push(item(APP_OPTN[mode], () => { calc.popTo(target); target.handle({ key: null, action: 'optn' }); }, more));
  }
  if (mode !== 'base') {
    items.push(
      sub('Func Analysis', [['Derivative(d/dx)', 'tpl:diff'], ['Integration', 'tpl:int'], ['Summation(Σ)', 'tpl:sum'],
        ['Logarithm(log)', 'tok:log('], ['Logarithm(logab)', 'tpl:logab'], ['Natural Log(ln)', 'tok:ln('],
        ['e^x', 'tpl:exp'], ['10^x', 'tpl:pow10']]),
      sub('Probability', [['%', 'tok:%'], ['Factorial(!)', 'tok:!'], ['Permutation(P)', 'tok:P'], ['Combination(C)', 'tok:C'],
        ['Random Number', 'tok:Ran#'], ['Random Integer', 'tok:RanInt#(']]),
      sub('Numeric Calc', [['Absolute Value', 'tpl:abs'], ['Round Off', 'tok:Rnd('], ['Cube(x³)', 'tok:³'], ['Cube Root', 'tpl:cbrt']]),
      sub('Angle/Coord/Sexa', [['Degrees(°)', 'tok:°u'], ['Radians(r)', 'tok:ʳ'], ['Gradians(g)', 'tok:ᵍ'],
        ['Rect to Polar', 'tok:Pol('], ['Polar to Rect', 'tok:Rec('], ['Degs Mins Secs', 'dms']]),
      sub('Hyperbolic/Trig', [['sinh', 'tok:sinh('], ['cosh', 'tok:cosh('], ['tanh', 'tok:tanh('], ['sinh⁻¹', 'tok:asinh('],
        ['cosh⁻¹', 'tok:acosh('], ['tanh⁻¹', 'tok:atanh('], ['sin', 'tok:sin('], ['cos', 'tok:cos('], ['tan', 'tok:tan('],
        ['sin⁻¹', 'tok:asin('], ['cos⁻¹', 'tok:acos('], ['tan⁻¹', 'tok:atan(']]),
      sub('Engineer Symbol', [['Milli(m)', 'tok:engm'], ['Micro(μ)', 'tok:engμ'], ['Nano(n)', 'tok:engn'], ['Pico(p)', 'tok:engp'],
        ['Femto(f)', 'tok:engf'], ['Kilo(k)', 'tok:engk'], ['Mega(M)', 'tok:engM'], ['Giga(G)', 'tok:engG'],
        ['Tera(T)', 'tok:engT'], ['Peta(P)', 'tok:engP'], ['Exa(E)', 'tok:engE']]),
      item('Sci Constants', () => { calc.popTo(target); target.handle({ key: null, action: 'const' }); }, more),
      item('Unit Conversions', () => { calc.popTo(target); target.handle({ key: null, action: 'conv' }); }, more),
    );
  }
  items.push(sub('Other', [['π', 'tok:π'], ['e', 'tok:e'], ['Ans', 'tok:Ans'], ['(', 'tok:('], [')', 'tok:)'], [',', 'tok:,'], ['=', 'tok:=']]));
  return new Menu(calc, [page(items)]);
}

// ---------------------------------------------------------------- TOOLS

/** TOOLS for screens without their own tools menu (Calculate, Complex input …). */
export function toolsMenu(calc) {
  const target = calc.top;
  const items = [];
  if (target.editor && typeof target.handle === 'function') {
    items.push(item('Undo', () => { calc.popTo(target); target.handle({ key: null, action: 'undo' }); }));
  }
  if (calc.mode === 'calc' && target.startCalc) {
    items.push(item('Evaluate (CALC)', () => { calc.popTo(target); target.startCalc(); }));
    items.push(item('Solve (SOLVE)', () => { calc.popTo(target); target.startSolve(); }));
  }
  items.push(item('Define f(x)', () => { calc.popTo(target); calc.push(defineScreen(calc, 'f')); }, more));
  items.push(item('Define g(x)', () => { calc.popTo(target); calc.push(defineScreen(calc, 'g')); }, more));
  return new Menu(calc, [page(items)]);
}

// ---------------------------------------------------------------- FORMAT

const BASE_CYCLE = { dec: 'hex', hex: 'bin', bin: 'oct', oct: 'dec' };

export function formatKey(calc) {
  const s = calc.top;
  if (calc.mode === 'base' && s.setBase) {
    s.setBase(BASE_CYCLE[calc.modeData.base || 'dec']);
    return;
  }
  if (s.phase !== 'result' || !s.result || !s.resultToggle) return;
  const { value } = s.result;
  if (value.pair || V.isMat(value) || V.isVec(value)) return;
  const view = s.result.view;
  const reset = () => { view.fact = false; view.dmsShown = undefined; view.eng = null; };
  const apply = (fn) => () => { calc.popTo(s); reset(); fn(); };
  const items = [
    item('Standard', apply(() => { view.form = 'exact'; view.mixed = undefined; view.polar = undefined; })),
    item('Decimal', apply(() => { view.form = 'dec'; })),
  ];
  if (V.isCx(value) || calc.mode === 'cmplx') {
    items.push(item('Rectangular Coord', apply(() => { view.polar = false; })));
    items.push(item('Polar Coord', apply(() => { view.polar = true; })));
  } else {
    if (calc.mode === 'calc') items.push(item('Prime Factor', apply(() => s.resultToggle('fact'))));
    items.push(
      item('Improper Fraction', apply(() => { view.form = 'exact'; view.mixed = false; })),
      item('Mixed Fraction', apply(() => { view.form = 'exact'; view.mixed = true; })),
      item('ENG Notation', apply(() => s.resultToggle('eng'))),
      item('Sexagesimal', apply(() => { view.dmsShown = true; })),
    );
  }
  calc.push(new Menu(calc, [page(items)]));
}
