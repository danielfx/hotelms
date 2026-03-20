/**
 * Board model: generation, moves, scanning, gravity, refill, obstacles.
 */
(function () {
  const C = () => window.WC_CONFIG;
  const D = () => window.WC_DICT;

  function randomLetter() {
    const w = C().LETTER_WEIGHTS;
    return w[Math.floor(Math.random() * w.length)];
  }

  function emptyCell() {
    return { kind: 'empty', letter: null };
  }

  function normalCell(letter) {
    return { kind: 'normal', letter };
  }

  function lockedCell(letter) {
    return { kind: 'locked', letter };
  }

  function bombCell() {
    return { kind: 'bomb', letter: null };
  }

  function blockerCell() {
    return { kind: 'blocker', letter: null };
  }

  function cloneCell(cell) {
    return { kind: cell.kind, letter: cell.letter };
  }

  function isSwappable(cell) {
    return cell.kind === 'normal' && cell.letter;
  }

  /** Letter participates in word runs (horizontal / vertical). */
  function contributesToWord(cell) {
    return (
      cell.letter &&
      (cell.kind === 'normal' || cell.kind === 'locked')
    );
  }

  function key(r, c) {
    return r + ',' + c;
  }

  function parseKey(k) {
    const [r, c] = k.split(',').map(Number);
    return { r, c };
  }

  function inBounds(board, r, c) {
    return r >= 0 && r < board.rows && c >= 0 && c < board.cols;
  }

  function neighbors4(r, c) {
    return [
      [r - 1, c],
      [r + 1, c],
      [r, c - 1],
      [r, c + 1],
    ];
  }

  function swapCells(board, r1, c1, r2, c2) {
    const t = board.cells[r1][c1];
    board.cells[r1][c1] = board.cells[r2][c2];
    board.cells[r2][c2] = t;
  }

  function canShortSwap(board, r1, c1, r2, c2) {
    if (!inBounds(board, r1, c1) || !inBounds(board, r2, c2)) return false;
    const dr = Math.abs(r1 - r2);
    const dc = Math.abs(c1 - c2);
    if (dr + dc !== 1) return false;
    const a = board.cells[r1][c1];
    const b = board.cells[r2][c2];
    return isSwappable(a) && isSwappable(b);
  }

  function canLongSwap(board, r1, c1, r2, c2) {
    if (!inBounds(board, r1, c1) || !inBounds(board, r2, c2)) return false;
    if (r1 === r2 && c1 === c2) return false;
    const a = board.cells[r1][c1];
    const b = board.cells[r2][c2];
    return isSwappable(a) && isSwappable(b);
  }

  /**
   * Collect all dictionary words in a letter run (substring matches, min len 3).
   * @returns {Array<{ word: string, cells: string[] }>}
   */
  function wordsInRun(cellsInOrder) {
    const minLen = C().MIN_WORD_LEN;
    const dict = D();
    const out = [];
    const n = cellsInOrder.length;
    for (let i = 0; i < n; i++) {
      let s = '';
      for (let j = i; j < n; j++) {
        s += cellsInOrder[j].letter;
        if (s.length >= minLen && dict.isValid(s)) {
          out.push({
            word: s,
            cells: cellsInOrder.slice(i, j + 1).map((x) => x.key),
          });
        }
      }
    }
    return out;
  }

  function scanWords(board) {
    const found = [];
    const rows = board.rows;
    const cols = board.cols;

    for (let r = 0; r < rows; r++) {
      let c = 0;
      while (c < cols) {
        const run = [];
        while (c < cols && contributesToWord(board.cells[r][c])) {
          run.push({ key: key(r, c), letter: board.cells[r][c].letter });
          c++;
        }
        if (run.length > 0) found.push(...wordsInRun(run));
        while (c < cols && !contributesToWord(board.cells[r][c])) c++;
      }
    }

    for (let c = 0; c < cols; c++) {
      let r = 0;
      while (r < rows) {
        const run = [];
        while (r < rows && contributesToWord(board.cells[r][c])) {
          run.push({ key: key(r, c), letter: board.cells[r][c].letter });
          r++;
        }
        if (run.length > 0) found.push(...wordsInRun(run));
        while (r < rows && !contributesToWord(board.cells[r][c])) r++;
      }
    }

    return found;
  }

  /**
   * Fixed cells in a column that never move (blocker, bomb).
   */
  function isColumnFixed(cell) {
    return cell.kind === 'blocker' || cell.kind === 'bomb';
  }

  function applyGravity(board) {
    const { rows, cols } = board;
    for (let c = 0; c < cols; c++) {
      let r = rows - 1;
      while (r >= 0) {
        const cell = board.cells[r][c];
        if (isColumnFixed(cell)) {
          r--;
          continue;
        }
        let segBottom = r;
        let segTop = r;
        while (segTop >= 0 && !isColumnFixed(board.cells[segTop][c])) {
          segTop--;
        }
        segTop++;
        const tiles = [];
        for (let i = segBottom; i >= segTop; i--) {
          const ch = board.cells[i][c];
          if (ch.kind === 'normal' || ch.kind === 'locked') {
            if (ch.letter) tiles.push(cloneCell(ch));
          }
        }
        for (let i = segTop; i <= segBottom; i++) {
          const ch = board.cells[i][c];
          if (isColumnFixed(ch)) continue;
          board.cells[i][c] = emptyCell();
        }
        let write = segBottom;
        for (const t of tiles) {
          while (
            write >= segTop &&
            isColumnFixed(board.cells[write][c])
          ) {
            write--;
          }
          if (write < segTop) break;
          board.cells[write][c] = t;
          write--;
        }
        r = segTop - 1;
      }
    }
  }

  function refill(board) {
    const { rows, cols } = board;
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        const cell = board.cells[r][c];
        if (isColumnFixed(cell)) continue;
        if (cell.kind === 'empty' || (cell.kind === 'normal' && !cell.letter)) {
          board.cells[r][c] = normalCell(randomLetter());
        }
      }
    }
  }

  /**
   * Expand removal set with bomb chain reactions (orthogonal to cleared cells).
   */
  function expandBombBlast(board, toClear) {
    const set = new Set(toClear);
    let changed = true;
    while (changed) {
      changed = false;
      const snapshot = [...set];
      for (const k of snapshot) {
        const { r, c } = parseKey(k);
        for (const [nr, nc] of neighbors4(r, c)) {
          if (!inBounds(board, nr, nc)) continue;
          const cell = board.cells[nr][nc];
          if (cell.kind === 'bomb' && !set.has(key(nr, nc))) {
            set.add(key(nr, nc));
            changed = true;
            for (const [br, bc] of neighbors4(nr, nc)) {
              if (!inBounds(board, br, bc)) continue;
              const b = board.cells[br][bc];
              if (b.kind === 'blocker') continue;
              if (!set.has(key(br, bc))) {
                set.add(key(br, bc));
                changed = true;
              }
            }
          }
        }
      }
    }
    return set;
  }

  function clearCells(board, keySet) {
    for (const k of keySet) {
      const { r, c } = parseKey(k);
      if (!inBounds(board, r, c)) continue;
      const cell = board.cells[r][c];
      if (cell.kind === 'blocker') continue;
      if (cell.kind === 'bomb') {
        board.cells[r][c] = emptyCell();
        continue;
      }
      if (cell.kind === 'locked' || cell.kind === 'normal') {
        board.cells[r][c] = emptyCell();
      }
    }
  }

  function createEmptyGrid(rows, cols) {
    const cells = [];
    for (let r = 0; r < rows; r++) {
      cells[r] = [];
      for (let c = 0; c < cols; c++) {
        cells[r][c] = normalCell(randomLetter());
      }
    }
    return cells;
  }

  /**
   * Seed obstacles; avoid overlapping swappable tiles for bomb/blocker placement.
   */
  function seedObstacles(board) {
    const cfg = C();
    const used = new Set();
    function place(kind, maker) {
      let guard = 0;
      while (guard++ < 200) {
        const r = Math.floor(Math.random() * board.rows);
        const c = Math.floor(Math.random() * board.cols);
        const k = key(r, c);
        if (used.has(k)) continue;
        used.add(k);
        board.cells[r][c] = maker();
        return;
      }
    }
    for (let i = 0; i < cfg.SEED_BOMB; i++) place('bomb', bombCell);
    for (let i = 0; i < cfg.SEED_BLOCKER; i++) place('blocker', blockerCell);
    for (let i = 0; i < cfg.SEED_LOCKED; i++) {
      let guard = 0;
      while (guard++ < 200) {
        const r = Math.floor(Math.random() * board.rows);
        const c = Math.floor(Math.random() * board.cols);
        const k = key(r, c);
        if (used.has(k)) continue;
        used.add(k);
        board.cells[r][c] = lockedCell(randomLetter());
        break;
      }
    }
  }

  function createBoard() {
    const cfg = C();
    const board = {
      rows: cfg.BOARD_ROWS,
      cols: cfg.BOARD_COLS,
      cells: createEmptyGrid(cfg.BOARD_ROWS, cfg.BOARD_COLS),
    };
    seedObstacles(board);
    return board;
  }

  window.WC_BOARD = {
    createBoard,
    cloneCell,
    emptyCell,
    normalCell,
    lockedCell,
    bombCell,
    blockerCell,
    isSwappable,
    contributesToWord,
    canShortSwap,
    canLongSwap,
    swapCells,
    scanWords,
    applyGravity,
    refill,
    expandBombBlast,
    clearCells,
    neighbors4,
    inBounds,
    key,
    parseKey,
  };
})();
