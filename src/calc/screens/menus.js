// MENU, SETUP, RESET, CONST, CONV, QR and the OPTN submenus shared by all modes.
import { h } from '../../ui/render.js';
import { scrollbar, LINES } from '../../ui/lcd.js';
import { Menu, Message, Confirm, DigitPrompt, page, item, closeMenus } from './common.js';
import { CONSTANT_GROUPS, CONSTANT_PAGES, CONVERSION_GROUPS, CONVERSION_PAGES } from '../../core/constants.js';
import { MENU_KEY } from '../keymap.js';
import { t, setLanguage, LANGUAGES } from '../i18n.js';

export { mainMenu, setupMenu, resetMenu, qrScreen, variableScreen, functionMenu, catalogMenu, toolsMenu, formatKey, APPS } from './cw.js';

// ---------------------------------------------------------------- CONST / CONV

// CONST and CONV lists are small-font pages whatever their length ("_" starts a label's subscripts: R_K-90)
function itemsPage(items, insert, calc, idOf, cols) {
  return page(items.map((it) => item(it.label, () => { closeMenus(calc); insert(idOf(it)); })), { cols, small: true });
}

export function constMenu(calc, insert) {
  const pages = CONSTANT_PAGES.map((idxs) => page(idxs.map((gi) => {
    const g = CONSTANT_GROUPS[gi];
    return item(g.name, () => calc.push(new Menu(calc, [itemsPage(g.items, insert, calc, (it) => `tok:const|${it.id}|${it.label}`, 3)], { sub: true })));
  })));
  return new Menu(calc, pages);
}

export function convMenu(calc, insert) {
  const pages = CONVERSION_PAGES.map((idxs) => page(idxs.map((gi) => {
    const g = CONVERSION_GROUPS[gi];
    return item(g.name, () => calc.push(new Menu(calc, [itemsPage(g.items, insert, calc, (it) => `tok:conv|${it.id}|${it.label}`, 2)], { sub: true })));
  })));
  return new Menu(calc, pages);
}

// ---------------------------------------------------------------- OPTN building blocks

export function hyperbolicMenu(calc, apply) {
  const fns = [['sinh', 'sinh('], ['cosh', 'cosh('], ['tanh', 'tanh('], ['sinh⁻¹', 'asinh('], ['cosh⁻¹', 'acosh('], ['tanh⁻¹', 'atanh(']];
  return new Menu(calc, [page(fns.map(([l, id]) => item(l, () => { closeMenus(calc); apply(`tok:${id}`); })), { cols: 2 })], { sub: true });
}

export function angleUnitMenu(calc, apply) {
  return new Menu(calc, [page([['°', '°u'], ['ʳ', 'ʳ'], ['ᵍ', 'ᵍ']].map(([l, id]) => item(l, () => { closeMenus(calc); apply(`tok:${id}`); })), { cols: 3 })], { sub: true });
}

export function engSymbolMenu(calc, apply) {
  const syms = ['m', 'μ', 'n', 'p', 'f', 'k', 'M', 'G', 'T', 'P', 'E'];
  return new Menu(calc, [page(syms.map((s) => item(s, () => { closeMenus(calc); apply(`tok:eng${s}`); })), { cols: 3 })], { sub: true });
}

/** The OPTN page common to calculation screens. */
export function commonOptnPage(calc, apply) {
  return page([
    item('Hyperbolic Func', () => calc.push(hyperbolicMenu(calc, apply))),
    item('Angle Unit', () => calc.push(angleUnitMenu(calc, apply))),
    item('Engineer Symbol', () => calc.push(engSymbolMenu(calc, apply))), // in every mode's OPTN (fx-991CE X)
  ]);
}
