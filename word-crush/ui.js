/**
 * DOM: HUD, star bar, board rendering, tile states, mode control, boosters.
 */
(function () {
  const C = () => window.WC_CONFIG;

  let game = null;
  let boardEl = null;
  let cells = [];

  function $(sel) {
    return document.querySelector(sel);
  }

  function el(tag, cls, text) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function cellKey(r, c) {
    return r + '-' + c;
  }

  function buildBoardDom() {
    boardEl = $('#wc-board');
    boardEl.innerHTML = '';
    cells = [];
    const rows = game.state.board.rows;
    const cols = game.state.board.cols;
    boardEl.style.setProperty('--wc-cols', String(cols));
    boardEl.style.setProperty('--wc-rows', String(rows));

    for (let r = 0; r < rows; r++) {
      cells[r] = [];
      for (let c = 0; c < cols; c++) {
        const wrap = el('button', 'wc-cell', '');
        wrap.type = 'button';
        wrap.dataset.r = String(r);
        wrap.dataset.c = String(c);
        wrap.id = 'wc-cell-' + cellKey(r, c);
        wrap.addEventListener('click', () => game.onCellClick(r, c));
        const face = el('span', 'wc-cell-face', '');
        wrap.appendChild(face);
        boardEl.appendChild(wrap);
        cells[r][c] = { wrap, face };
      }
    }
  }

  function renderCellVisual(r, c) {
    const cell = game.state.board.cells[r][c];
    const { wrap, face } = cells[r][c];
    wrap.className = 'wc-cell';
    face.textContent = '';

    if (cell.kind === 'blocker') {
      wrap.classList.add('wc-blocker');
      return;
    }
    if (cell.kind === 'bomb') {
      wrap.classList.add('wc-bomb');
      face.textContent = '●';
      return;
    }
    if (cell.kind === 'empty') {
      wrap.classList.add('wc-empty');
      return;
    }
    if (cell.kind === 'locked') {
      wrap.classList.add('wc-locked');
      face.textContent = cell.letter || '';
      return;
    }
    face.textContent = cell.letter || '';
  }

  function renderBoard() {
    if (!cells.length) return;
    for (let r = 0; r < game.state.board.rows; r++) {
      for (let c = 0; c < game.state.board.cols; c++) {
        renderCellVisual(r, c);
      }
    }
    applySelectionDecorations();
  }

  function applySelectionDecorations() {
    const s = game.state.selection;
    const targets = new Set(
      game.validTargetsForSelection().map((t) => cellKey(t.r, t.c))
    );

    for (let r = 0; r < game.state.board.rows; r++) {
      for (let c = 0; c < game.state.board.cols; c++) {
        const { wrap } = cells[r][c];
        wrap.classList.remove('wc-selected', 'wc-target', 'wc-target-long');
        if (s && s.r === r && s.c === c) wrap.classList.add('wc-selected');
        else if (s && targets.has(cellKey(r, c))) {
          wrap.classList.add(
            game.state.mode === 'long' ? 'wc-target-long' : 'wc-target'
          );
        }
      }
    }
  }

  function updateHud() {
    const st = game.state;
    $('#wc-moves').textContent = String(st.movesLeft);
    $('#wc-score').textContent = String(st.score);
    $('#wc-goal').textContent = String(st.goalScore);
    $('#wc-long').textContent = String(st.longLeft);
    $('#wc-level').textContent = '1';

    const th = C().STARS;
    const maxStar = th[th.length - 1] || 4800;
    const pct = Math.min(100, Math.round((st.score / maxStar) * 100));
    $('#wc-star-fill').style.width = pct + '%';

    for (let i = 0; i < 3; i++) {
      const star = $('#wc-star-' + (i + 1));
      star.classList.toggle('wc-star-on', st.score >= th[i]);
      star.classList.toggle('wc-star-off', st.score < th[i]);
      $('#wc-th-' + (i + 1)).textContent = String(th[i]);
    }

    const msg = $('#wc-toast');
    if (msg) msg.textContent = st.lastMessage || '';

    document.body.classList.toggle('wc-resolving', st.resolving);
    document.body.classList.toggle('wc-won', st.won);
    document.body.classList.toggle('wc-lost', st.lost);
  }

  function setModeButtons() {
    const st = game.state.mode;
    $('#wc-mode-short').classList.toggle('wc-seg-active', st === 'short');
    $('#wc-mode-long').classList.toggle('wc-seg-active', st === 'long');
  }

  function highlightWords(words, round) {
    const seen = new Set();
    for (const w of words) {
      for (const k of w.cells) {
        if (seen.has(k)) continue;
        seen.add(k);
        const { r, c } = window.WC_BOARD.parseKey(k);
        if (cells[r] && cells[r][c]) {
          cells[r][c].wrap.classList.add('wc-match');
          if (round > 0) cells[r][c].wrap.classList.add('wc-cascade');
        }
      }
    }
  }

  function clearHighlights() {
    for (let r = 0; r < cells.length; r++) {
      for (let c = 0; c < (cells[r] || []).length; c++) {
        if (!cells[r][c]) continue;
        cells[r][c].wrap.classList.remove('wc-match', 'wc-cascade', 'wc-clearing');
      }
    }
  }

  function flashClear(blasted) {
    for (const k of blasted) {
      const { r, c } = window.WC_BOARD.parseKey(k);
      if (cells[r] && cells[r][c]) {
        cells[r][c].wrap.classList.add('wc-clearing');
      }
    }
  }

  function showComboBurst(wordCount, round, points) {
    const layer = $('#wc-fx');
    if (!layer) return;
    const tag = el('div', 'wc-combo-pop', '');
    if (round === 0 && wordCount > 1) {
      tag.textContent = wordCount + '× COMBO +' + points;
    } else if (round > 0) {
      tag.textContent = 'CASCADE ×' + (round + 1) + ' +' + points;
    } else {
      tag.textContent = '+' + points;
    }
    layer.appendChild(tag);
    requestAnimationFrame(() => tag.classList.add('wc-combo-pop-show'));
    setTimeout(() => {
      tag.remove();
    }, C().TIMING.COMBO_BURST);
  }

  function playSwapAnimation(r1, c1, r2, c2) {
    const a = cells[r1][c1].wrap;
    const b = cells[r2][c2].wrap;
    a.classList.add('wc-swap-a');
    b.classList.add('wc-swap-b');
    return new Promise((res) => {
      setTimeout(() => {
        a.classList.remove('wc-swap-a');
        b.classList.remove('wc-swap-b');
        res();
      }, 220);
    });
  }

  function onStateChange() {
    renderBoard();
    updateHud();
    setModeButtons();
  }

  function wireChrome() {
    $('#wc-back').addEventListener('click', () => {
      game.state.lastMessage = 'Back: menu not in prototype.';
      updateHud();
    });
    $('#wc-settings').addEventListener('click', () => {
      game.state.lastMessage = 'Settings: not in prototype.';
      updateHud();
    });

    $('#wc-mode-short').addEventListener('click', () => game.setMode('short'));
    $('#wc-mode-long').addEventListener('click', () => game.setMode('long'));

    $('#wc-booster-hint').addEventListener('click', () => game.useHint());
    $('#wc-booster-shuffle').addEventListener('click', () => game.shuffleBoard());
    $('#wc-booster-hammer').addEventListener('click', () => game.useHammer());
    $('#wc-booster-bomb').addEventListener('click', () => game.useBombBooster());

    $('#wc-restart').addEventListener('click', async () => {
      game.restart();
      buildBoardDom();
      onStateChange();
      if (typeof game.kickoff === 'function') await game.kickoff();
    });
  }

  function init(g) {
    game = g;
    buildBoardDom();
    wireChrome();
    onStateChange();
  }

  window.WC_UI = {
    init,
    onStateChange,
    highlightWords,
    clearHighlights,
    flashClear,
    showComboBurst,
    playSwapAnimation,
  };

  document.addEventListener('DOMContentLoaded', () => {
    const g = window.WC_GAME.createGame();
    init(g);
    if (typeof g.kickoff === 'function') g.kickoff();
  });
})();
