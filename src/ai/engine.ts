import { type BoardState } from "../classes/BoardState";
import { COMPUTER } from "../consts";
import { type StateControllers } from "../types";

import { forEachCell, gridValToColor } from "../utils";

export const calculateScore = ({ grid, turn }: BoardState) => {
  let score = 0;
  forEachCell((r, c) => {
    const cell = grid[r][c];
    const color = gridValToColor[cell];
    if (!color) return;
    let value = 0;
    switch (cell) {
      case 0:
      case 2:
        value = 1;
        break;
      case 1:
      case 3:
        value = 2;
    }
    score += color === turn ? value : -value;
  });
  return score;
};

const DEPTH = 5;

type BestMove = {
  score: number;
  move: {
    finalRow: number;
    finalColumn: number;
    startRow: number;
    startColumn: number;
  };
};

function bestMove(state: BoardState) {
  function bestScore(state: BoardState, depth = DEPTH) {
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
  let best: BestMove = {
    score: 0,
    move: { finalColumn: 0, finalRow: 0, startColumn: 0, startRow: 0 },
  };
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
  return best;
}

export const doAiMove = (
  state: BoardState,
  handleMove: StateControllers["handleMove"]
) => {
  if (state.turn !== COMPUTER) return;
  setTimeout(() => {
    const t0 = performance.now();
    const {
      move: { finalRow, finalColumn, startRow, startColumn },
      score,
    } = bestMove(state);
    console.log(score);

    const elapsed = performance.now() - t0;
    const maxiumum400 = Math.max(250 - elapsed, 0);
    setTimeout(() => {
      handleMove(finalRow, finalColumn, startRow, startColumn);
    }, maxiumum400);
  }, 50);
};
