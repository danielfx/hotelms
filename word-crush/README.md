# WORD CRUSH — playable prototype

Tile-manipulation word puzzle: **SHORT** (adjacent swap) and **LONG** (any two movable letters swap). After each swap the board scans for horizontal/vertical dictionary words (length ≥ 3), clears matches, applies gravity and refill, and repeats for cascades. No drag-to-spell.

## File tree

```
word-crush/
├── index.html      # App shell & layout (HUD, board, mode, boosters)
├── styles.css      # Premium neutral styling, tile states, responsive portrait
├── config.js       # Board size, moves, LONG count, goals, stars, timing
├── dictionary.js   # Curated word set + isValid()
├── board.js        # Grid, obstacles, swaps, scan, gravity, refill, bomb blast
├── game.js         # Modes, selection, resolution loop, scoring, win/lose shells
├── README.md       # This file
└── ui.js           # DOM render, highlights, HUD, segmented control
```

## Run locally

From this folder, serve over HTTP (recommended — some browsers restrict `file://` behavior):

```bash
cd word-crush
python3 -m http.server 8080
```

Open `http://localhost:8080`.

## What works

- **SHORT mode**: select a letter tile, then an **adjacent** movable letter to swap.
- **LONG mode**: toggle LONG, pick two movable letters **anywhere**; uses one LONG charge per swap.
- **Word scan**: horizontal + vertical, min length 3, curated dictionary (~2.7k words).
- **Combos**: multiple words in the same resolution step before the next gravity pass add combo bonus scoring; pop-up shows combo/cascade feedback.
- **Cascades**: after clear → gravity → refill → scan again until stable.
- **Obstacles**: **locked** (letter, cannot swap), **bomb** (fixed; chain reaction when orthogonally touched by a word clear), **blocker** (fixed, breaks words, indestructible).
- **Scoring & stars**: score feeds the top bar; three star thresholds from `config.js` (1500 / 3000 / 4800 by default).
- **Win / lose (shell)**: win when score ≥ goal **after at least one player swap**; lose when moves reach 0 without winning.
- **Initial settle**: on load (and **New board**), the board auto-resolves existing words **without** counting as a win.
- **Shuffle booster**: shuffles letters on all **normal** movable tiles (obstacles unchanged).

## Partial / placeholder

- **Hint / Hammer / Bomb boosters**: toast only; no full solver or board edit yet.
- **Back / Settings**: placeholder toasts.
- **No-move detection & auto-reshuffle**: not implemented (shuffle is manual).
- **Swap animation**: light scale pulse, not a true tile flight path.
- **Level progression**: badge shows `1`; no `levels.js` yet.

## Not implemented

- Sound, haptics, cloud save, ads, meta progression.
- Timed mode (HUD shows Moves only).
- Multiplier tiles, daily puzzles, achievements.
