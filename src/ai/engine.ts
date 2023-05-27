import { type BoardState } from "../classes/BoardState";
import { COMPUTER } from "../consts";
import { type StateControllers } from "../types";

import { forEachCell, gridValToColor } from "../utils";

const valueToScore = [1, 1.2, 1, 1.2, 0] as const;

export const calculateScore = ({ grid, turn }: BoardState) => {
  let score = 0;
  forEachCell((r, c) => {
    const cell = grid[r][c];
    const color = gridValToColor[cell];
    if (!color) return;
    const value = valueToScore[cell];
    score += color === turn ? value : -value;
  });
  return score;
};

const ODD_DEPTH = 5;
if (ODD_DEPTH % 2 === 0) {
  throw new Error("Depth must be odd");
}

const defaultBest = {
  score: 0,
  move: { finalColumn: 0, finalRow: 0, startColumn: 0, startRow: 0 },
};
function bestMove(state: BoardState) {
  function bestScore(state: BoardState, depth = ODD_DEPTH) {
    if (!depth) {
      return calculateScore(state);
    }

    let max = 0;
    for (const [, potentialMoves] of state.getAllLegalMovesForColor()) {
      for (const { updates } of potentialMoves) {
        const score = bestScore(
          state.updatedGrid(updates).updateCurrentTurn(),
          depth - 1
        );
        if (score >= max) {
          max = score;
        }
      }
    }
    return max;
  }
  let best = defaultBest;
  for (const [cell, potentialMoves] of state.getAllLegalMovesForColor()) {
    for (const { updates, finalCell } of potentialMoves) {
      const score = bestScore(state.updatedGrid(updates).updateCurrentTurn());
      if (score >= best.score) {
        best = {
          score,
          move: {
            startRow: cell.row,
            startColumn: cell.column,
            finalRow: finalCell.row,
            finalColumn: finalCell.column,
          },
        };
      }
    }
  }
  return best.move;
}

export const doAiMove = (
  state: BoardState,
  handleMove: StateControllers["handleMove"]
) => {
  if (state.turn !== COMPUTER) return;
  setTimeout(() => {
    const t0 = performance.now();
    const { finalRow, finalColumn, startRow, startColumn } = bestMove(state);
    const elapsed = performance.now() - t0;
    const maxiumum400 = Math.max(250 - elapsed, 0);
    setTimeout(() => {
      handleMove(finalRow, finalColumn, startRow, startColumn);
    }, maxiumum400);
  }, 50);
};
