// Builds the fx-991CW keypad. Key ids are the hardware keys; the calculator resolves SHIFT.
// Geometry, symbols and label placement are measured from the front view of the real fx-991CW:
// every key is round; SHIFT labels sit above-left of their key with a small gold "L" bracket;
// the cursor keys sit in a plus-shaped recess with OK in the middle; a page rocker on the right.
// Design size 460×960 (zoomed to the window).

// ---------------------------------------------------------------- symbols (1 unit = 0.1em)

const svg = (w, h, body, cls = 'ico') =>
  `<svg class="${cls}" viewBox="0 0 ${w} ${h}" style="width:${w / 10}em;height:${h / 10}em" fill="none" stroke="currentColor" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
const fill = (x, y, w, h) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="currentColor" stroke="none"/>`;
const box = (x, y, w, h, sw = 0.9) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" stroke-width="${sw}"/>`;
const radical = (x, h, w) => `<path d="M${x} ${h * 0.62} L${x + 1.3} ${h * 0.5} L${x + 3} ${h} L${x + 5.4} 0.6 H${x + 5.4 + w}" stroke-width="1.3"/>`;
const txt = (x, y, size, s, extra = '') =>
  `<text x="${x}" y="${y}" font-size="${size}" fill="currentColor" stroke="none" font-family="Bahnschrift, 'DIN Alternate', 'Segoe UI', sans-serif" ${extra}>${s}</text>`;

const ICON = {
  // fraction: filled numerator box over a bar over an empty denominator box
  frac: svg(8, 11, `${fill(1, 0.4, 6, 3.6)}<path d="M0.2 5.5 h7.6" stroke-width="1.2"/>${box(1.3, 7, 5.4, 3.5)}`),
  mixed: svg(12, 10, `${fill(0.4, 3, 3.8, 4)}${fill(6.6, 0.4, 4.6, 3)}<path d="M5.8 5 h6"/>${box(6.9, 6.2, 4, 3.2, 0.8)}`),
  sqrt: svg(12, 10, `${radical(0.4, 9.4, 5.8)}${fill(6.6, 2.6, 4.8, 5.6)}`),
  root: svg(13, 10, `${fill(0.2, 1, 2.8, 2.6)}${radical(1.6, 9.4, 5.8)}${box(8, 2.6, 4.4, 5.6, 0.9)}`),
  pow: svg(12, 10, `${fill(0.4, 3, 6.6, 6.6)}${box(8, 0.5, 3.4, 3.4, 0.9)}`),
  sqr: svg(12, 10, `${fill(0.4, 3, 6.6, 6.6)}${txt(7.4, 4.6, 5.2, '2', 'font-weight="700"')}`),
  recip: svg(10, 10, `${fill(0.3, 3, 4.8, 5)}${txt(5.4, 4.2, 4.4, '−1', 'font-weight="700"')}`),
  logArgs: svg(8, 10, `${fill(0.2, 5.4, 2.8, 3.6)}${box(4, 1.4, 3.6, 7.6, 1)}`),
  expBox: svg(4, 9, fill(0.4, 0.4, 3.2, 3.2)),
  // FORMAT: the word between two curved arrows (one sweeping right on top, one sweeping left below)
  formatTop: svg(24, 6, '<path d="M3 5.2 A11 8 0 0 1 20.4 3.4" stroke-width="1.2"/><path d="M17.8 1.6 L20.8 3.6 L18.4 6" stroke-width="1.2"/>', 'ico fmt-arc'),
  formatBot: svg(24, 6, '<path d="M21 0.8 A11 8 0 0 1 3.6 2.6" stroke-width="1.2"/><path d="M6.2 4.4 L3.2 2.4 L5.6 0" stroke-width="1.2"/>', 'ico fmt-arc'),
  // system keys
  home: svg(12, 11, '<path d="M1.6 5.4 L6 1.4 L10.4 5.4 V10 H1.6 Z" stroke-width="1.2"/><path d="M4.4 10 V7.4 H7.6 V10" stroke-width="1.1"/>'),
  back: svg(12, 10, '<path d="M4 1.6 L1.2 4.4 L4 7.2" stroke-width="1.25"/><path d="M1.6 4.4 H7.4 A2.6 2.6 0 0 1 7.4 9.6 H4.4" stroke-width="1.25"/>'),
  settings: svg(13, 10, '<path d="M1 2 H12 M1 5 H12 M1 8 H12" stroke-width="1.15"/><rect x="7.4" y="0.6" width="2" height="2.8" rx="0.4" fill="currentColor" stroke="none"/><rect x="3.2" y="3.6" width="2" height="2.8" rx="0.4" fill="currentColor" stroke="none"/><rect x="8.6" y="6.6" width="2" height="2.8" rx="0.4" fill="currentColor" stroke="none"/>'),
  shift: svg(12, 13, '<path d="M6 1 L11 6.4 H8.4 V12 H3.6 V6.4 H1 Z" stroke-width="1.15"/>'),
  variable: svg(17, 11, `<path d="M1 3.6 H6.2 M4.6 2 L6.4 3.6 L4.6 5.2 M6.2 7.4 H1 M2.6 5.8 L0.8 7.4 L2.6 9" stroke-width="0.95"/><rect x="8" y="1" width="8.2" height="9" stroke-width="0.85" stroke-dasharray="1.1 0.7"/><text x="9.4" y="8.1" font-size="7.4" font-style="italic" fill="currentColor" stroke="none" font-family="'Cambria Math', Cambria, 'Times New Roman', serif">x</text>`),
  function: `<span class="fx-f">f</span><span class="fx-p">(<span class="it">x</span>)</span>`,
  catalog: svg(13, 11, '<path d="M6.5 2.4 C5 1.2 2.8 1 0.8 1.4 V9.4 C2.8 9 5 9.2 6.5 10.2 C8 9.2 10.2 9 12.2 9.4 V1.4 C10.2 1 8 1.2 6.5 2.4 Z" stroke-width="1.05"/><path d="M6.5 2.4 V10" stroke-width="1.05"/>'),
  tools: svg(14, 5, '<circle cx="2.2" cy="2.5" r="1.6"/><circle cx="7" cy="2.5" r="1.6"/><circle cx="11.8" cy="2.5" r="1.6"/>'),
  del: svg(15, 10, '<path d="M4.6 0.8 H13.8 Q14.4 0.8 14.4 1.4 V8.6 Q14.4 9.2 13.8 9.2 H4.6 L0.6 5 Z" fill="currentColor" stroke="none"/><path d="M7.2 3 L11.2 7 M11.2 3 L7.2 7" stroke="#47494a" stroke-width="1.5"/>'),
  pgUp: svg(10, 10, '<path d="M1.6 4.8 L5 1.4 L8.4 4.8 M1.6 8.8 L5 5.4 L8.4 8.8" stroke-width="1.2"/>'),
  pgDn: svg(10, 10, '<path d="M1.6 1.2 L5 4.6 L8.4 1.2 M1.6 5.2 L5 8.6 L8.4 5.2" stroke-width="1.2"/>'),
  arrowL: svg(6, 9, '<path d="M4.6 1 L1.4 4.5 L4.6 8" stroke-width="1.3"/>'),
  arrowR: svg(6, 9, '<path d="M1.4 1 L4.6 4.5 L1.4 8" stroke-width="1.3"/>'),
  arrowU: svg(9, 6, '<path d="M1 4.8 L4.5 1.4 L8 4.8" stroke-width="1.3"/>'),
  arrowD: svg(9, 6, '<path d="M1 1.2 L4.5 4.6 L8 1.2" stroke-width="1.3"/>'),
};

const it = (s) => `<span class="it">${s}</span>`;
const sup = (s) => `<sup>${s}</sup>`;

// ---------------------------------------------------------------- key definitions
// [id, face html, SHIFT label html]

const FN_ROWS = [
  [
    ['X', it('x'), 'QR'],
    ['FRAC', ICON.frac, ICON.mixed],
    ['SQRT', ICON.sqrt, ICON.root],
    ['POW', ICON.pow, ICON.recip],
    ['SQR', ICON.sqr, 'log'],
    ['LOG', `log${ICON.logArgs}`, 'ln'],
  ],
  [
    ['ANS', 'Ans', ''],
    ['SIN', 'sin', `sin${sup('−1')}`],
    ['COS', 'cos', `cos${sup('−1')}`],
    ['TAN', 'tan', `tan${sup('−1')}`],
    ['LP', '(', '<span class="big">=</span>'],
    ['RP', ')', '<span class="big">,</span>'],
  ],
];

const NUM_ROWS = [
  [['7', '7', 'π'], ['8', '8', it('e')], ['9', '9', it('i')], ['DEL', ICON.del, 'INS'], ['AC', 'AC', 'OFF']],
  [['4', '4', 'A'], ['5', '5', 'B'], ['6', '6', 'C'], ['MUL', '×', ''], ['DIV', '÷', '']],
  [['1', '1', 'D'], ['2', '2', 'E'], ['3', '3', 'F'], ['ADD', '+', '°&#8239;’&#8239;”'], ['SUB', '−', '(−)']],
  [['0', '0', it('x')], ['DOT', '.', it('y')], ['EXP', `×10${ICON.expBox}`, it('z')],
    ['FORMAT', `${ICON.formatTop}<span class="fmt-word">FORMAT</span>${ICON.formatBot}`, ''], ['EXE', 'EXE', '≈']],
];

// ---------------------------------------------------------------- geometry (design px, measured)

const COLS6 = [58.5, 126.9, 195.3, 263.7, 332.1, 400.5];
const SYS = { rows: [374.5, 436], d: 46, labelY: [344.5, 404] };
const PAD = { cx: 263.7, cy: 436.5, up: 375, down: 498, dx: 68.4, d: 44, ok: 46 };
const ROCK = { cx: 400.5, top: 356, bottom: 459, w: 44 };
const SHIFT_ROW = { y: 509.5, d: 45, labelY: 475 };
const FN = { y: [570.5, 629], d: 44, lx: -27, ly: -30, by: [-24, -13] };
const NUM = { x: [60.5, 144.5, 228.5, 312.5, 396.5], y: [698, 767.5, 837, 906.5], d: 56.5, lx: -30, ly: -35, by: [-27, -17] };

function place(el, x, y, w, h) {
  Object.assign(el.style, { left: `${x}px`, top: `${y}px`, width: `${w}px`, height: `${h}px` });
  return el;
}

function div(cls, x, y, w, h) {
  const el = place(document.createElement('div'), x, y, w, h);
  el.className = cls;
  return el;
}

/** A centred label whose vertical middle is at `cy`. */
function label(html, cx, cy, cls) {
  const el = div(`labels ${cls}`, cx - 45, cy - 9, 90, 18);
  el.innerHTML = `<span>${html}</span>`;
  return el;
}

/** A gold SHIFT label above-left of a key, joined to it by the small "L" bracket. */
function shiftLabel(root, html, cx, cy, g) {
  const bx = cx + g.lx;
  root.append(label(html, bx, cy + g.ly, 's'));
  root.append(div('bracket', bx, cy + g.by[0], 6, g.by[1] - g.by[0]));
}

function button(id, face, cls, cx, cy, w, h = w) {
  const btn = place(document.createElement('button'), cx - w / 2, cy - h / 2, w, h);
  btn.className = `key ${cls}`;
  btn.dataset.key = id;
  btn.innerHTML = face;
  btn.setAttribute('aria-label', id);
  return btn;
}

/** The cursor keys: four round arrow keys and OK, sitting in a plus-shaped recess. */
function dpad(root) {
  const { cx, cy, up, down, dx, d, ok } = PAD;
  const half = d / 2 + 5;
  root.append(
    div('pad-well', cx - dx - half, cy - half, dx * 2 + half * 2, half * 2),
    div('pad-well', cx - half, up - half, half * 2, down - up + half * 2),
    button('UP', ICON.arrowU, 'sys pad', cx, up, d),
    button('DOWN', ICON.arrowD, 'sys pad', cx, down, d),
    button('LEFT', ICON.arrowL, 'sys pad', cx - dx, cy, d),
    button('RIGHT', ICON.arrowR, 'sys pad', cx + dx, cy, d),
    button('OK', '<span class="ok-word">OK</span>', 'sys pad ok', cx, cy, ok),
  );
}

/** Renders the keypad into `root`; calls onKey(id) on presses. Returns a function that flashes a key. */
export function buildKeypad(root, onKey) {
  // ON / HOME over SETTINGS / BACK
  const [r0, r1] = SYS.rows;
  root.append(
    label('ON', COLS6[0], SYS.labelY[0], 'w'),
    label('HOME', COLS6[1], SYS.labelY[0], 'w'),
    label('SETTINGS', COLS6[0], SYS.labelY[1], 'w'),
    button('ON', '<span class="on-mark"></span>', 'sys on', COLS6[0], r0, 36),
    button('HOME', ICON.home, 'sys', COLS6[1], r0, SYS.d),
    button('SETTINGS', ICON.settings, 'sys', COLS6[0], r1, SYS.d),
    button('BACK', ICON.back, 'sys', COLS6[1], r1, SYS.d),
  );
  dpad(root);

  // page rocker: one pill split into an upper and a lower half
  const { cx: rx, top, bottom, w: rw } = ROCK;
  const mid = (top + bottom) / 2;
  root.append(div('rocker', rx - rw / 2 - 3, top - 3, rw + 6, bottom - top + 6));
  root.append(
    button('PGUP', ICON.pgUp, 'rock up', rx, (top + mid) / 2, rw, mid - top),
    button('PGDN', ICON.pgDn, 'rock dn', rx, (mid + bottom) / 2, rw, bottom - mid),
  );

  // SHIFT / VARIABLE / FUNCTION / (down arrow) / CATALOG / TOOLS
  const shiftRow = [
    ['SHIFT', ICON.shift, 'SHIFT', 0],
    ['VARIABLE', ICON.variable, 'VARIABLE', 1],
    ['FUNCTION', ICON.function, 'FUNCTION', 2],
    ['CATALOG', ICON.catalog, 'CATALOG', 4],
    ['TOOLS', ICON.tools, 'TOOLS', 5],
  ];
  for (const [id, face, text, c] of shiftRow) {
    const cx = COLS6[c];
    root.append(label(text, cx, SHIFT_ROW.labelY, id === 'SHIFT' ? 'y' : 'w'));
    root.append(button(id, face, id === 'SHIFT' ? 'shift' : 'fn top', cx, SHIFT_ROW.y, SHIFT_ROW.d));
  }

  FN_ROWS.forEach((row, r) => row.forEach(([id, face, s], c) => {
    const cx = COLS6[c], cy = FN.y[r];
    if (s) shiftLabel(root, s, cx, cy, FN);
    root.append(button(id, face, 'fn', cx, cy, FN.d));
  }));

  NUM_ROWS.forEach((row, r) => row.forEach(([id, face, s], c) => {
    const cx = NUM.x[c], cy = NUM.y[r];
    if (s) shiftLabel(root, s, cx, cy, NUM);
    const cls = id === 'FORMAT' ? 'num format' : 'num';
    root.append(button(id, face, cls, cx, cy, NUM.d));
  }));

  root.addEventListener('pointerdown', (e) => {
    const b = e.target.closest('[data-key]');
    if (!b) return;
    e.preventDefault();
    onKey(b.dataset.key);
  });

  return (id) => {
    const b = root.querySelector(`[data-key="${id}"]`);
    if (!b) return;
    b.classList.add('pressed');
    setTimeout(() => b.classList.remove('pressed'), 120);
  };
}

// PC keyboard shortcuts (F1 shows this list in the app).
export const KEYBOARD = {
  '0': '0', '1': '1', '2': '2', '3': '3', '4': '4', '5': '5', '6': '6', '7': '7', '8': '8', '9': '9',
  '.': 'DOT', ',': 'RP', '+': 'ADD', '-': 'SUB', '*': 'MUL', '/': 'DIV', '(': 'LP', ')': 'RP', '^': 'POW',
  Enter: 'EXE', '=': 'EXE', Backspace: 'DEL', Delete: 'DEL', Escape: 'AC',
  ArrowUp: 'UP', ArrowDown: 'DOWN', ArrowLeft: 'LEFT', ArrowRight: 'RIGHT', PageUp: 'PGUP', PageDown: 'PGDN',
  Home: 'HOME', F2: 'SHIFT', F3: 'VARIABLE', F4: 'FUNCTION', F5: 'CATALOG', F6: 'TOOLS', F7: 'FORMAT', F8: 'SETTINGS',
  F9: 'BACK', Tab: 'OK',
  s: 'SIN', c: 'COS', t: 'TAN', l: 'LOG', q: 'SQRT', r: 'SQRT', x: 'X', a: 'ANS', e: 'EXP', f: 'FRAC',
};

export const KEYBOARD_HELP = [
  ['0–9 . + − × ÷ ( )', 'same keys'], ['Enter', 'EXE'], ['Tab', 'OK'], ['Backspace', 'DEL'], ['Esc', 'AC'],
  ['Arrows', 'cursor pad'], ['PgUp/PgDn', 'page scroll'], ['Home', 'HOME'], ['F2', 'SHIFT'], ['F3', 'VARIABLE'],
  ['F4', 'FUNCTION'], ['F5', 'CATALOG'], ['F6', 'TOOLS'], ['F7', 'FORMAT'], ['F8', 'SETTINGS'], ['F9', 'BACK'],
  ['^', '■□'], ['s c t', 'sin cos tan'], ['l', 'log■□'], ['q', '√'], ['f', 'fraction'], ['x', 'x'], ['a', 'Ans'],
  ['e', '×10■'], ['Ctrl+C', 'copy result'],
];
