/**
 * Main loop: modes, moves, resolution, scoring, win/lose shells.
 */
(function () {
  const B = () => window.WC_BOARD;
  const C = () => window.WC_CONFIG;

  function delay(ms) {
    return new Promise((res) => setTimeout(res, ms));
  }

  function createGame() {
    const state = {
      board: B().createBoard(),
      mode: 'short',
      selection: null,
      swapTarget: null,
      movesLeft: C().MAX_MOVES,
      longLeft: C().LONG_MOVES_START,
      score: 0,
      goalScore: C().GOAL_SCORE,
      resolving: false,
      won: false,
      lost: false,
      lastMessage: '',
      starsEarned: 0,
      playerHasMoved: false,
    };

    function notify() {
      if (typeof window.WC_UI !== 'undefined' && window.WC_UI.onStateChange) {
        window.WC_UI.onStateChange(state);
      }
    }

    function setMessage(msg) {
      state.lastMessage = msg;
      notify();
    }

    function updateStars() {
      const th = C().STARS;
      let s = 0;
      if (state.score >= th[0]) s = 1;
      if (state.score >= th[1]) s = 2;
      if (state.score >= th[2]) s = 3;
      state.starsEarned = s;
    }

    function scoreWords(words, roundIndex) {
      const ppc = C().POINTS_PER_LETTER;
      let base = 0;
      for (const w of words) {
        base += w.word.length * ppc;
      }
      if (roundIndex === 0 && words.length > 1) {
        base += C().COMBO_BONUS_PER_WORD * (words.length - 1);
      }
      if (roundIndex > 0) {
        const mult = 1 + C().CASCADE_MULTIPLIER_STEP * roundIndex;
        base = Math.floor(base * mult);
      }
      return base;
    }

    async function resolveBoard(opts) {
      const towardWin = opts && opts.towardWin;
      if (state.resolving) return;
      state.resolving = true;
      notify();

      let round = 0;
      try {
        while (true) {
          const words = B().scanWords(state.board);
          if (words.length === 0) break;

          if (window.WC_UI && window.WC_UI.highlightWords) {
            window.WC_UI.highlightWords(words, round);
          }
          await delay(C().TIMING.HIGHLIGHT);

          const add = scoreWords(words, round);
          state.score += add;
          updateStars();

          const toClear = new Set();
          for (const w of words) {
            for (const k of w.cells) toClear.add(k);
          }
          const blasted = B().expandBombBlast(state.board, toClear);

          if (window.WC_UI && window.WC_UI.showComboBurst) {
            window.WC_UI.showComboBurst(words.length, round, add);
          }

          B().clearCells(state.board, blasted);
          if (window.WC_UI && window.WC_UI.flashClear) {
            window.WC_UI.flashClear(blasted);
          }
          await delay(C().TIMING.CLEAR);

          B().applyGravity(state.board);
          notify();
          await delay(C().TIMING.FALL);

          B().refill(state.board);
          notify();
          await delay(C().TIMING.REFILL);

          round++;
        }

        if (towardWin && state.score >= state.goalScore) state.won = true;
        if (state.movesLeft <= 0 && !state.won) state.lost = true;

        if (state.won) setMessage('Goal reached — level clear (prototype).');
        else if (state.lost) setMessage('Out of moves (prototype).');
      } finally {
        state.resolving = false;
        if (window.WC_UI && window.WC_UI.clearHighlights) {
          window.WC_UI.clearHighlights();
        }
        notify();
      }
    }

    function clearSelection() {
      state.selection = null;
      state.swapTarget = null;
      notify();
    }

    function isSelectable(r, c) {
      return B().isSwappable(state.board.cells[r][c]);
    }

    function validTargetsForSelection() {
      if (!state.selection) return [];
      const { r, c } = state.selection;
      const out = [];
      if (state.mode === 'long') {
        for (let y = 0; y < state.board.rows; y++) {
          for (let x = 0; x < state.board.cols; x++) {
            if (y === r && x === c) continue;
            if (B().canLongSwap(state.board, r, c, y, x)) out.push({ r: y, c: x });
          }
        }
        return out;
      }
      for (const [nr, nc] of B().neighbors4(r, c)) {
        if (B().canShortSwap(state.board, r, c, nr, nc)) {
          out.push({ r: nr, c: nc });
        }
      }
      return out;
    }

    async function tryExecuteSwap(r2, c2) {
      const r1 = state.selection.r;
      const c1 = state.selection.c;
      const ok =
        state.mode === 'long'
          ? B().canLongSwap(state.board, r1, c1, r2, c2)
          : B().canShortSwap(state.board, r1, c1, r2, c2);

      if (!ok) {
        setMessage('Invalid swap.');
        clearSelection();
        return;
      }

      if (state.mode === 'long') {
        if (state.longLeft <= 0) {
          setMessage('No LONG moves left.');
          clearSelection();
          return;
        }
        state.longLeft--;
      }

      B().swapCells(state.board, r1, c1, r2, c2);
      state.movesLeft = Math.max(0, state.movesLeft - 1);
      state.playerHasMoved = true;
      clearSelection();

      if (window.WC_UI && window.WC_UI.playSwapAnimation) {
        await window.WC_UI.playSwapAnimation(r1, c1, r2, c2);
      }

      notify();
      await resolveBoard({ towardWin: true });
    }

    async function onCellClick(r, c) {
      if (state.resolving || state.won || state.lost) return;

      if (!B().inBounds(state.board, r, c)) return;

      const cell = state.board.cells[r][c];

      if (!state.selection) {
        if (!B().isSwappable(cell)) {
          setMessage('That tile cannot be moved.');
          return;
        }
        state.selection = { r, c };
        notify();
        return;
      }

      if (state.selection.r === r && state.selection.c === c) {
        clearSelection();
        return;
      }

      if (state.mode === 'short') {
        if (!B().canShortSwap(state.board, state.selection.r, state.selection.c, r, c)) {
          if (B().isSwappable(cell)) {
            state.selection = { r, c };
            notify();
          } else {
            setMessage('Choose an adjacent letter tile.');
          }
          return;
        }
      } else {
        if (!B().canLongSwap(state.board, state.selection.r, state.selection.c, r, c)) {
          if (B().isSwappable(cell)) {
            state.selection = { r, c };
            notify();
          } else {
            setMessage('Choose another movable letter.');
          }
          return;
        }
      }

      await tryExecuteSwap(r, c);
    }

    function setMode(mode) {
      if (mode !== 'short' && mode !== 'long') return;
      state.mode = mode;
      clearSelection();
      setMessage(mode === 'long' ? 'LONG: pick any two movable letters.' : 'SHORT: adjacent swaps only.');
    }

    function shuffleBoard() {
      if (state.resolving || state.won || state.lost) return;
      const positions = [];
      for (let r = 0; r < state.board.rows; r++) {
        for (let c = 0; c < state.board.cols; c++) {
          const cell = state.board.cells[r][c];
          if (cell.kind === 'normal' && cell.letter) {
            positions.push({ r, c, letter: cell.letter });
          }
        }
      }
      const letters = positions.map((p) => p.letter);
      for (let i = letters.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const t = letters[i];
        letters[i] = letters[j];
        letters[j] = t;
      }
      positions.forEach((p, i) => {
        state.board.cells[p.r][p.c] = B().normalCell(letters[i]);
      });
      clearSelection();
      setMessage('Board shuffled.');
      notify();
    }

    function useHint() {
      setMessage('Hint: look for almost-words; full hint search is not wired yet.');
      notify();
    }

    function useHammer() {
      setMessage('Hammer booster: prototype — use swaps to clear.');
      notify();
    }

    function useBombBooster() {
      setMessage('Bomb booster: prototype — use bomb tiles on the board.');
      notify();
    }

    function restart() {
      state.board = B().createBoard();
      state.mode = 'short';
      state.selection = null;
      state.movesLeft = C().MAX_MOVES;
      state.longLeft = C().LONG_MOVES_START;
      state.score = 0;
      state.won = false;
      state.lost = false;
      state.starsEarned = 0;
      state.lastMessage = '';
      state.playerHasMoved = false;
      notify();
    }

    return {
      state,
      onCellClick,
      setMode,
      shuffleBoard,
      useHint,
      useHammer,
      useBombBooster,
      restart,
      validTargetsForSelection,
      clearSelection,
      notify,
      kickoff: () => resolveBoard({ towardWin: false }),
    };
  }

  window.WC_GAME = { createGame };
})();
