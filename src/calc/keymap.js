// Hardware key → action, per modifier (fx-991CW layout). Overrides apply in Base-N and Complex modes.
//   n: plain, s: after SHIFT, b: Base-N plain, bs: Base-N after SHIFT, c: Complex plain
export const KEYMAP = {
  UP: { n: 'up' }, DOWN: { n: 'down' }, LEFT: { n: 'left' }, RIGHT: { n: 'right' },
  PGUP: { n: 'pgup' }, PGDN: { n: 'pgdn' },
  OK: { n: 'eq' },
  ON: { n: 'on' },
  HOME: { n: 'home' },
  SETTINGS: { n: 'setup' },
  BACK: { n: 'back' },
  VARIABLE: { n: 'variable' },
  FUNCTION: { n: 'function' },
  CATALOG: { n: 'catalog' },
  TOOLS: { n: 'optn' },
  X: { n: 'var:x', s: 'qr' },
  FRAC: { n: 'tpl:frac', s: 'tpl:mixed' },
  SQRT: { n: 'tpl:sqrt', s: 'tpl:root' },
  POW: { n: 'tpl:pow', s: 'tok:⁻¹' },
  SQR: { n: 'tok:²', s: 'tok:log(' },
  LOG: { n: 'tpl:logab', s: 'tok:ln(' },
  ANS: { n: 'tok:Ans' },
  SIN: { n: 'tok:sin(', s: 'tok:asin(' },
  COS: { n: 'tok:cos(', s: 'tok:acos(' },
  TAN: { n: 'tok:tan(', s: 'tok:atan(' },
  LP: { n: 'tok:(', s: 'tok:=' },
  RP: { n: 'tok:)', s: 'tok:,' },
  7: { n: 'tok:7', s: 'tok:π' },
  8: { n: 'tok:8', s: 'tok:e' },
  9: { n: 'tok:9', s: 'tok:i' },
  DEL: { n: 'del', s: 'ins' },
  AC: { n: 'ac', s: 'off' },
  4: { n: 'tok:4', s: 'var:A', bs: 'hex:A' },
  5: { n: 'tok:5', s: 'var:B', bs: 'hex:B' },
  6: { n: 'tok:6', s: 'var:C', bs: 'hex:C' },
  1: { n: 'tok:1', s: 'var:D', bs: 'hex:D' },
  2: { n: 'tok:2', s: 'var:E', bs: 'hex:E' },
  3: { n: 'tok:3', s: 'var:F', bs: 'hex:F' },
  0: { n: 'tok:0', s: 'var:x' },
  MUL: { n: 'tok:×' },
  DIV: { n: 'tok:÷' },
  ADD: { n: 'tok:+', s: 'dms' },
  SUB: { n: 'tok:-', s: 'tok:neg' },
  DOT: { n: 'tok:.', s: 'var:y', b: 'noop' }, // Base-N takes no decimals
  EXP: { n: 'exp', s: 'var:z', b: 'noop' }, // nor exponents
  FORMAT: { n: 'format' },
  EXE: { n: 'eq', s: 'approx' },
};

/** The key whose SHIFT label is a variable, used after STO (VARIABLE → Store) and on recall screens. */
export const VARIABLE_KEYS = { 4: 'A', 5: 'B', 6: 'C', 1: 'D', 2: 'E', 3: 'F', 0: 'x', DOT: 'y', EXP: 'z', X: 'x' };
/** The key for each variable (inverse of VARIABLE_KEYS). */
export const KEY_OF_VARIABLE = { A: '4', B: '5', C: '6', D: '1', E: '2', F: '3', x: '0', y: 'DOT', z: 'EXP' };

/** Number keys still pick numbered items in a few legacy screens. */
export const MENU_KEY = { 1: '1', 2: '2', 3: '3', 4: '4', 5: '5', 6: '6', 7: '7', 8: '8', 9: '9', 0: '0' };

export function resolveKey(key, { shift, mode }) {
  const m = KEYMAP[key];
  if (!m) return null;
  if (mode === 'base') {
    if (shift && m.bs) return m.bs;
    if (!shift && m.b) return m.b;
  }
  if (shift && m.s) return m.s;
  return m.n;
}
