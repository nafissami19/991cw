// The CW-style menu: a highlighted item moved with the cursor keys.
import { h } from '../../ui/render.js';
import { t } from '../i18n.js';
import { LINES, SMALL_LINES, scrollbar } from '../../ui/lcd.js';

// column spacing by font and column count; three small-font columns start one pixel in
const COLUMN = { L: { 1: 0, 2: 96, 3: 66 }, S: { 1: 0, 2: 96, 3: 60 } };

/** A radio button (○ / ◉) at x, on a line whose baseline is `base`. Returns the width used. */
function radio(lcd, x, base, on, small) {
  const d = small ? 5 : 7;
  const y = base - d - (small ? 1 : 2);
  const r = (d - 1) / 2;
  for (let j = 0; j < d; j++) {
    for (let i = 0; i < d; i++) {
      const dist = Math.hypot(i - r, j - r);
      if (Math.abs(dist - r) < 0.65) lcd.dot(x + i, y + j);
      else if (on && dist < r - 1.2) lcd.dot(x + i, y + j);
    }
  }
  return d + 3;
}

/** Closes all menus on top of the stack. */
export function closeMenus(calc) {
  while (calc.screens.length > 1 && calc.top.isMenu) calc.screens.pop();
}

/**
 * pages: [{ items: [{ label, run(calc, menu), more, radio }], cols = 1, small = false }]
 * OK/EXE selects the highlighted item, ▶ enters items with lower levels (▸), BACK (or ◀ in a sub menu)
 * returns to the parent menu and AC closes all menus. One-column menus scroll as a single list;
 * multi-column pages (Engineer Symbol, constants) keep their pages.
 */
export class Menu {
  constructor(calc, pages, { sub = false, onClose = null, title = null, sel = 0 } = {}) {
    this.calc = calc;
    this.pages = pages;
    this.page = 0;
    this.sub = sub;
    this.onClose = onClose;
    this.title = title;
    this.isMenu = true;
    this.handlesBack = true;
    this.handlesPage = true;
    this.flat = pages.every((p) => (p.cols || 1) === 1 && p.pairFrom == null);
    this.items = this.flat ? pages.flatMap((p) => p.items) : null;
    this.smallList = this.flat && (pages.some((p) => p.small) || this.items.length > 4 && pages.some((p) => p.items.length > 4));
    this.sel = 0; // index into the list (flat) or into the page
    this.top = 0;
    if (sel) this.select(sel);
  }

  select(i) {
    if (this.flat) {
      this.sel = Math.max(0, Math.min(i, this.items.length - 1));
      this.scrollTo();
    } else this.sel = i;
  }

  get visible() { return (this.smallList ? 6 : 4) - (this.title ? 1 : 0); }

  scrollTo() {
    const v = this.visible;
    if (this.sel < this.top) this.top = this.sel;
    if (this.sel >= this.top + v) this.top = this.sel - v + 1;
  }

  current() {
    return this.flat ? this.items[this.sel] : this.pages[this.page].items[this.sel];
  }

  run() {
    const it = this.current();
    if (it && it.run) it.run(this.calc, this);
  }

  back() {
    this.calc.pop();
    if (!this.sub) this.onClose?.();
  }

  handle(ev) {
    const a = ev.action;
    if (this.flat) {
      const n = this.items.length;
      const v = this.visible;
      switch (a) {
        case 'down': this.sel = (this.sel + 1) % n; this.scrollTo(); return true;
        case 'up': this.sel = (this.sel - 1 + n) % n; this.scrollTo(); return true;
        case 'pgdn':
          this.top = Math.min(Math.max(0, n - v), this.top + v);
          this.sel = Math.min(n - 1, Math.max(this.sel + v, this.top));
          this.scrollTo();
          return true;
        case 'pgup':
          this.top = Math.max(0, this.top - v);
          this.sel = Math.max(0, this.sel - v);
          this.scrollTo();
          return true;
        case 'right': if (this.current()?.more) this.run(); return true;
        case 'left': if (this.sub) this.calc.pop(); return true;
        default: break;
      }
    } else {
      const page = this.pages[this.page];
      const cols = page.cols || 1;
      const n = page.items.length;
      const turn = (d) => {
        this.page = (this.page + d + this.pages.length) % this.pages.length;
        return this.pages[this.page].items.length;
      };
      switch (a) {
        case 'right': this.sel = (this.sel + 1) % n; return true;
        case 'left': this.sel = (this.sel - 1 + n) % n; return true;
        case 'down':
          if (this.sel + cols < n) this.sel += cols;
          else { const c = this.sel % cols; const m = turn(1); this.sel = Math.min(c, m - 1); }
          return true;
        case 'up':
          if (this.sel - cols >= 0) this.sel -= cols;
          else {
            const c = this.sel % cols;
            const m = turn(-1);
            const pc = this.pages[this.page].cols || 1;
            const last = Math.floor((m - 1) / pc) * pc;
            this.sel = Math.min(last + c, m - 1);
          }
          return true;
        case 'pgdn': turn(1); this.sel = 0; return true;
        case 'pgup': turn(-1); this.sel = 0; return true;
        default: break;
      }
    }
    switch (a) {
      case 'eq': this.run(); return true;
      case 'back': this.back(); return true;
      case 'ac':
        closeMenus(this.calc);
        this.onClose?.();
        return true;
      default:
        return true; // other keys are ignored while a menu is shown
    }
  }

  view() {
    const it = this.current();
    return { el: h('div', 'menu', h('div', 'item', it ? t(it.label) : '')), status: { sub: this.sub } };
  }

  paint(lcd) {
    return this.flat ? this.paintList(lcd) : this.paintGrid(lcd);
  }

  /** One column: four main-font lines (six small-font ones), the selected line inverted. */
  paintList(lcd) {
    const small = this.smallList;
    const font = small ? 'S' : 'L';
    const lines = small ? SMALL_LINES : LINES;
    const lh = small ? 10 : 16;
    let line = 0;
    if (this.title) {
      lcd.text(t(this.title), 1, lines[line++], { font });
      lcd.fill(0, lines[0] + (small ? 1 : 2), 187, 1);
    }
    const v = this.visible;
    for (let k = 0; k < v; k++) {
      const i = this.top + k;
      const it = this.items[i];
      if (!it) break;
      const base = lines[line + k];
      let x = 2;
      if (it.radio != null) x += radio(lcd, x, base, it.radio, small);
      lcd.text(t(it.label), x, base, { font });
      if (it.more) lcd.text('▸', small ? 181 : 178, base, { font });
      if (i === this.sel) lcd.invert(0, base - lh + (small ? 2 : 3), 187, lh);
    }
    const n = this.items.length;
    if (n > v) {
      const y0 = this.title ? lines[0] + 4 : 0;
      const span = 63 - y0;
      const top = y0 + Math.round((this.top * span) / n);
      const bot = y0 + Math.round(((this.top + v) * span) / n);
      lcd.fill(190, y0, 1, span);
      lcd.fill(189, top, 3, Math.max(3, bot - top));
    }
    return { sub: this.sub };
  }

  /** Multi-column pages: as on the EX, with the selected cell inverted. */
  paintGrid(lcd) {
    const page = this.pages[this.page];
    const cols = page.cols || 1;
    const pairFrom = page.pairFrom ?? (cols === 2 && !page.small ? 0 : null);
    const lineCount = pairFrom != null ? pairFrom + Math.ceil((page.items.length - pairFrom) / 2) : Math.ceil(page.items.length / cols);
    const small = page.small || lineCount + (this.title ? 1 : 0) > 4;
    const font = small ? 'S' : 'L';
    const lines = small ? SMALL_LINES : LINES;
    const lh = small ? 10 : 16;
    let line = 0;
    if (this.title) lcd.text(t(this.title), 0, lines[line++], { font });
    let colW = COLUMN[font][cols] || 186;
    let hi = null;
    page.items.forEach((it, i) => {
      let r, x;
      if (pairFrom != null && !small) {
        r = i < pairFrom ? i : pairFrom + Math.floor((i - pairFrom) / 2);
        x = i >= pairFrom && (i - pairFrom) % 2 ? 96 : 0;
        colW = i >= pairFrom ? 96 : 186;
      } else {
        r = Math.floor(i / cols);
        x = (i % cols) * COLUMN[font][cols];
      }
      if (line + r < lines.length) {
        const base = lines[line + r];
        lcd.text(t(it.label), x + 2, base, { font });
        if (i === this.sel) hi = [x, base - lh + (small ? 2 : 3), Math.min(colW, 186 - x) - 1, lh];
      }
    });
    if (hi) lcd.invert(...hi);
    scrollbar(lcd, this.page, this.pages.length);
    return { sub: this.sub };
  }
}

/**
 * "Number of Rows? Select 1~4" as a CW list: the numbers min…max as items (digit keys also pick).
 * labels: optional item texts per number.
 */
export function numberMenu(calc, title, min, max, onPick, labels = null) {
  const nums = Array.from({ length: max - min + 1 }, (_, i) => min + i);
  const m = new Menu(calc, [{ items: nums.map((n, i) => ({ label: labels ? labels[i] : String(n), run: () => onPick(n) })) }], { sub: true, title });
  const base = m.handle.bind(m);
  m.handle = (ev) => {
    const d = /^tok:(\d)$/.exec(ev.action || '');
    if (d) { if (+d[1] >= min && +d[1] <= max) onPick(+d[1]); return true; }
    return base(ev);
  };
  return m;
}
