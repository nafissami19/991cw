// Shared screens: paged menus, messages, errors, confirmations, digit prompts.
import { h } from '../../ui/render.js';
import { MENU_KEY } from '../keymap.js';
import { MENU_KEYS } from '../../core/constants.js';
import { t } from '../i18n.js';
import { LINES, SMALL_LINES, scrollbar } from '../../ui/lcd.js';

/** Scrollbar of a paged screen: the track is split into one equal segment per page. */
export function pageBar(page, pages) {
  const bar = h('div', 'scrollbar');
  bar.style.top = `${(100 / pages) * page}%`;
  bar.style.height = `${100 / pages}%`;
  return bar;
}

export { Menu, closeMenus } from './menu.js';
import { closeMenus } from './menu.js';

export const page = (items, opts = {}) => ({ items, ...opts });
export const item = (label, run, opts = {}) => ({ label, run, ...opts });

/** A message screen (e.g. "No Solution"); AC, = or ◀▶ close it. */
export class Message {
  constructor(calc, lines, { onClose = null, keys = ['ac', 'eq', 'left', 'right'] } = {}) {
    this.calc = calc;
    this.lines = lines;
    this.onClose = onClose;
    this.keys = keys;
  }

  handle(ev) {
    if (this.keys.includes(ev.action)) {
      this.calc.pop();
      this.onClose?.(ev.action);
    }
    return true;
  }

  view() {
    return { el: h('div', 'message', this.lines.map((l) => h('div', null, t(l)))) };
  }

  paint(lcd) {
    this.lines.forEach((l, i) => { if (i < 4) lcd.text(t(l), 0, LINES[i]); });
  }
}

/** Error screen: AC cancels, ◀/▶ go back to the input at the error position. */
export class ErrorScreen {
  constructor(calc, kind, { onCancel, onGoto }) {
    this.calc = calc;
    this.kind = kind;
    this.onCancel = onCancel;
    this.onGoto = onGoto;
  }

  handle(ev) {
    if (ev.action === 'ac') { this.calc.pop(); this.onCancel?.(); }
    else if (ev.action === 'left' || ev.action === 'right') { this.calc.pop(); this.onGoto?.(); }
    else if (['menu', 'setup', 'reset'].includes(ev.action)) return false;
    return true;
  }

  view() {
    const goto = this.onGoto ? h('div', null, t('[◀][▶]:Goto')) : null;
    return { el: h('div', 'message', h('div', 'big', t(this.kind)), h('div', null, ' '), h('div', null, t('[AC] :Cancel')), goto) };
  }

  /** "Math ERROR" on the first line, [AC] and [◀][▶] on the third and fourth (User's Guide). */
  paint(lcd) {
    lcd.text(t(this.kind), 0, LINES[0]);
    lcd.text(t('[AC] :Cancel'), 0, LINES[2]);
    if (this.onGoto) lcd.text(t('[◀][▶]:Goto'), 0, LINES[3]);
  }
}

/** "Yes:[=]  Cancel:[AC]" confirmation. */
export class Confirm {
  constructor(calc, question, onYes) {
    this.calc = calc;
    this.question = question;
    this.onYes = onYes;
  }

  handle(ev) {
    if (ev.action === 'eq') { this.calc.pop(); this.onYes(); }
    else if (ev.action === 'ac') this.calc.pop();
    return true;
  }

  view() {
    return { el: h('div', 'message', h('div', null, t(this.question)), h('div', null, ' '), h('div', null, t('Yes   :[OK]')), h('div', null, t('Cancel:[AC]'))) };
  }

  paint(lcd) {
    lcd.text(t(this.question), 0, LINES[0]);
    lcd.text(t('Yes   :[OK]'), 0, LINES[2]);
    lcd.text(t('Cancel:[AC]'), 0, LINES[3]);
  }
}

/** Prompts for a single digit within a range, e.g. "Fix 0~9?". */
export class DigitPrompt {
  constructor(calc, text, min, max, onDigit) {
    this.calc = calc;
    this.text = text;
    this.min = min;
    this.max = max;
    this.onDigit = onDigit;
    this.isMenu = true;
  }

  handle(ev) {
    const d = /^tok:(\d)$/.exec(ev.action || '');
    if (d && +d[1] >= this.min && +d[1] <= this.max) this.onDigit(+d[1]);
    else if (ev.action === 'ac') closeMenus(this.calc);
    else if (ev.action === 'left') this.calc.pop();
    return true;
  }

  view() {
    return { el: h('div', 'menu', h('div', 'item', t(this.text))) };
  }

  paint(lcd) {
    lcd.text(t(this.text), 0, LINES[0]);
  }
}
