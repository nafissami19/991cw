// Math Box app (fx-991CW): Dice Roll and Coin Toss probability simulations.
import { h } from '../../ui/render.js';
import { LINES, SMALL_LINES } from '../../ui/lcd.js';
import { Menu, page, item, closeMenus } from '../screens/common.js';

const more = { more: true };

/** The app's bottom screen: any key brings the Math Box menu back. */
class Root {
  constructor(calc) { this.calc = calc; }
  handle(ev) {
    if (['eq', 'ac', 'back', 'up', 'down', 'left', 'right'].includes(ev.action)) { this.calc.push(topMenu(this.calc)); return true; }
    return ev.action === 'optn';
  }
  view() { return { el: h('div', 'message'), status: { noMath: true } }; }
  paint() { return { noMath: true }; }
}

export const mathboxMode = {
  start(calc) {
    const md = calc.modeData;
    md.dice = { count: 2, attempts: 10 };
    md.coin = { count: 1, attempts: 10 };
    calc.push(new Root(calc));
    calc.push(topMenu(calc));
  },
};

function topMenu(calc) {
  const m = new Menu(calc, [page([
    item('Dice Roll', () => calc.push(paramMenu(calc, 'dice')), more),
    item('Coin Toss', () => calc.push(paramMenu(calc, 'coin')), more),
  ])]);
  m.back = () => calc.goHome();
  return m;
}

/** Parameter screen: number of dice/coins, attempts, Execute. */
function paramMenu(calc, kind, sel = 0) {
  const p = calc.modeData[kind];
  const noun = kind === 'dice' ? 'Dice' : 'Coins';
  const refresh = (s) => { calc.pop(); calc.push(paramMenu(calc, kind, s)); };
  const m = new Menu(calc, [page([
    item(`${noun}: ${p.count}`, () => calc.push(new Menu(calc, [page([1, 2, 3].map((n) => item(kind === 'dice' ? ['1 Die', '2 Dice', '3 Dice'][n - 1] : ['1 Coin', '2 Coins', '3 Coins'][n - 1], () => {
      p.count = n;
      calc.pop();
      refresh(0);
    }, { radio: p.count === n })))], { sub: true, title: noun, sel: p.count - 1 })), more),
    item(`Attempts: ${p.attempts}`, () => calc.push(new NumberInput(calc, 'Attempts', 1, 250, p.attempts, (n) => { p.attempts = n; calc.pop(); refresh(1); })), more),
    item('Execute', () => {
      const result = kind === 'dice' ? rollDice(p.count, p.attempts) : tossCoins(p.count, p.attempts);
      calc.push(resultTypeMenu(calc, kind, result));
    }),
  ])], { sub: true, sel });
  return m;
}

/** Numeric entry for Attempts (1~250). */
class NumberInput {
  constructor(calc, title, min, max, value, onDone) {
    Object.assign(this, { calc, title, min, max, onDone });
    this.text = String(value);
    this.fresh = true;
    this.isMenu = true;
    this.handlesBack = true;
    this.err = false;
  }

  handle(ev) {
    const a = ev.action || '';
    const d = /^tok:(\d)$/.exec(a);
    this.err = false;
    if (d) {
      if (this.fresh) { this.text = ''; this.fresh = false; }
      if (this.text.length < 3) this.text += d[1];
    } else if (a === 'del') { this.fresh = false; this.text = this.text.slice(0, -1); }
    else if (a === 'ac') { this.text = ''; this.fresh = false; }
    else if (a === 'eq') {
      const n = Number(this.text);
      if (this.text && n >= this.min && n <= this.max) this.onDone(n);
      else this.err = true;
    } else if (a === 'back') this.calc.pop();
    return true;
  }

  view() { return { el: h('div', 'menu', h('div', 'item', `${this.title}: ${this.text}`)) }; }

  paint(lcd) {
    lcd.text(this.title, 1, LINES[0]);
    lcd.fill(0, LINES[0] + 2, 187, 1);
    const x = lcd.text(this.text, 2, LINES[1] + 4);
    if (lcd.cursorOn) lcd.fill(x + 1, LINES[1] - 7, 2, 12);
    lcd.text(this.err ? `Enter ${this.min}~${this.max}` : `${this.min}~${this.max}`, 2, LINES[3], { font: 'S' });
    return {};
  }
}

// ---------------------------------------------------------------- simulation

const die = () => 1 + Math.floor(Math.random() * 6);

function rollDice(count, attempts) {
  const rows = [];
  for (let i = 0; i < attempts; i++) {
    const v = Array.from({ length: count }, die);
    rows.push({ v, sum: v.reduce((a, b) => a + b, 0), diff: count === 2 ? Math.abs(v[0] - v[1]) : null });
  }
  return { kind: 'dice', count, attempts, rows };
}

function tossCoins(count, attempts) {
  const rows = [];
  for (let i = 0; i < attempts; i++) {
    const v = Array.from({ length: count }, () => (Math.random() < 0.5 ? 'H' : 'T'));
    rows.push({ v, heads: v.filter((c) => c === 'H').length });
  }
  return { kind: 'coin', count, attempts, rows };
}

function frequencyRows(result, field, from, to) {
  const out = [];
  for (let k = from; k <= to; k++) {
    const f = result.rows.filter((r) => r[field] === k).length;
    out.push([String(k), String(f), fmt(f / result.attempts)]);
  }
  return out;
}

const fmt = (x) => {
  if (x === 0) return '0';
  if (x === 1) return '1';
  return String(Math.round(x * 1e4) / 1e4).replace(/^0\./, '0.');
};

function resultTypeMenu(calc, kind, result) {
  const listCols = kind === 'dice'
    ? (result.count === 1 ? ['A'] : result.count === 2 ? ['A', 'B', 'Sum', 'Diff'] : ['A', 'B', 'C', 'Sum'])
    : ['A', 'B', 'C'].slice(0, result.count).concat(result.count > 1 ? ['Heads'] : []);
  const listRows = result.rows.map((r) => {
    if (kind === 'dice') return [...r.v.map(String), ...(result.count > 1 ? [String(r.sum)] : []), ...(result.count === 2 ? [String(r.diff)] : [])];
    return [...r.v, ...(result.count > 1 ? [String(r.heads)] : [])];
  });
  const showList = () => calc.push(new TableScreen(calc, ['', ...listCols], listRows.map((r, i) => [String(i + 1), ...r])));
  const freq = (label, field, from, to) => () => calc.push(new TableScreen(calc, [label, 'Freq', 'Rel Fr'], frequencyRows(result, field, from, to)));
  let relFreq;
  if (kind === 'dice') {
    if (result.count === 1) relFreq = freq('Sum', 'sum', 1, 6);
    else if (result.count === 3) relFreq = freq('Sum', 'sum', 3, 18);
    else {
      relFreq = () => calc.push(new Menu(calc, [page([
        item('Sum', freq('Sum', 'sum', 2, 12)),
        item('Difference', freq('Diff', 'diff', 0, 5)),
      ])], { sub: true, title: 'Relative Freq' }));
    }
  } else if (result.count === 1) {
    relFreq = () => {
      const heads = result.rows.filter((r) => r.heads === 1).length;
      calc.push(new TableScreen(calc, ['Side', 'Freq', 'Rel Fr'], [['Heads', String(heads), fmt(heads / result.attempts)], ['Tails', String(result.attempts - heads), fmt(1 - heads / result.attempts)]]));
    };
  } else relFreq = freq('Heads', 'heads', 0, result.count);
  const m = new Menu(calc, [page([
    item('List', showList, more),
    item('Relative Freq', relFreq, more),
  ])], { sub: true, title: 'Result Type' });
  return m;
}

/** A scrollable small-font table with a header row; the selected row is inverted. */
class TableScreen {
  constructor(calc, headers, rows) {
    Object.assign(this, { calc, headers, rows });
    this.sel = 0;
    this.top = 0;
    this.isMenu = true;
    this.handlesBack = true;
    this.handlesPage = true;
  }

  handle(ev) {
    const n = this.rows.length;
    switch (ev.action) {
      case 'down': this.sel = Math.min(n - 1, this.sel + 1); break;
      case 'up': this.sel = Math.max(0, this.sel - 1); break;
      case 'pgdn': this.sel = Math.min(n - 1, this.sel + 5); break;
      case 'pgup': this.sel = Math.max(0, this.sel - 5); break;
      case 'back': case 'eq': case 'left': this.calc.pop(); return true;
      case 'ac': closeMenus(this.calc); return true;
      default: return true;
    }
    if (this.sel < this.top) this.top = this.sel;
    if (this.sel > this.top + 4) this.top = this.sel - 4;
    return true;
  }

  view() { return { el: h('div', 'menu', h('div', 'item', this.headers.join(' '))) }; }

  paint(lcd) {
    const cols = this.headers.length;
    const first = this.headers[0] === '' ? 24 : 0;
    const w = (186 - first) / (cols - (first ? 1 : 0));
    const colX = this.headers.map((_, i) => (i === 0 && first ? 0 : Math.round(first + (i - (first ? 1 : 0)) * w)));
    const colW = this.headers.map((_, i) => (i === 0 && first ? first : Math.round(w)));
    this.headers.forEach((hd, i) => lcd.textRight(hd, colX[i] + colW[i] - 2, SMALL_LINES[0], { font: 'S' }));
    lcd.fill(0, SMALL_LINES[0] + 1, 187, 1);
    for (let k = 0; k < 5; k++) {
      const r = this.rows[this.top + k];
      if (!r) break;
      const base = SMALL_LINES[k + 1];
      r.forEach((cell, i) => lcd.textRight(cell, colX[i] + colW[i] - 2, base, { font: 'S' }));
      if (this.top + k === this.sel) lcd.invert(0, base - 8, 187, 10);
    }
    for (let i = 1; i < cols; i++) lcd.fill(Math.round(colX[i]) - 1, 0, 1, 61);
    const n = this.rows.length;
    if (n > 5) {
      lcd.fill(190, 12, 1, 51);
      const t0 = 12 + Math.round((this.top * 51) / n), t1 = 12 + Math.round(((this.top + 5) * 51) / n);
      lcd.fill(189, t0, 3, Math.max(3, t1 - t0));
    }
    return { noMath: true, up: this.top > 0, down: this.top + 5 < n };
  }
}
