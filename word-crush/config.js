/**
 * WORD CRUSH — level and tuning constants
 */
window.WC_CONFIG = {
  BOARD_COLS: 6,
  BOARD_ROWS: 8,

  /** Moves before lose (shell) */
  MAX_MOVES: 25,

  /** LONG swaps per level */
  LONG_MOVES_START: 3,

  /** Win: reach this score */
  GOAL_SCORE: 3500,

  /** Star thresholds (score) */
  STARS: [1500, 3000, 4800],

  /** Base points per letter in a cleared word */
  POINTS_PER_LETTER: 10,

  /** Bonus per extra word in same resolution step (combo) */
  COMBO_BONUS_PER_WORD: 50,

  /** Multiplier applied per cascade depth (after first settle) */
  CASCADE_MULTIPLIER_STEP: 0.25,

  /** Minimum word length */
  MIN_WORD_LEN: 3,

  /** Refill alphabet weights (simple English-ish) */
  LETTER_WEIGHTS: 'EEEEEEEEAAAAAAIIIIIOOOOOUUUUUUSSSSTTTTLLRRNNNDDHCCMMFFPPGGWWYYBBVKXJQZ',

  /** Obstacle counts for generated board */
  SEED_LOCKED: 1,
  SEED_BOMB: 1,
  SEED_BLOCKER: 1,

  /** Resolution animation pacing (ms) */
  TIMING: {
    HIGHLIGHT: 420,
    CLEAR: 380,
    FALL: 320,
    REFILL: 280,
    COMBO_BURST: 500,
  },
};
