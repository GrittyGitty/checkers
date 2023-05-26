import {
  generateGridUpdatesForMoveIfLegal,
  type BoardState,
} from "../classes/BoardState";
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
        value = 1;
        break;
      case 1:
        value = 2;
        break;
      case 2:
        value = 1;
        break;
      case 3:
        value = 2;
        break;
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

function bestMove(state: BoardState, depth = DEPTH): BestMove {
  const currentScore = calculateScore(state);
  let best: BestMove = {
    score: 0,
    move: { finalColumn: 0, finalRow: 0, startColumn: 0, startRow: 0 },
  };

  const states: BoardState[] = [];
  for (const { row, column } of state.getPiecesThatCanMove()) {
    for (const { row: finalRow, column: finalColumn } of state.getLegalTargets(
      row,
      column
    )) {
      const move = {
        finalRow,
        finalColumn,
        startRow: row,
        startColumn: column,
      };
      const updates = generateGridUpdatesForMoveIfLegal(state, move);
      const newState = state.updatedGrid(updates);
      states.push(newState);
      const score = calculateScore(newState);
      let diff = score - currentScore;
      if (depth) {
        diff += bestMove(newState.updateCurrentTurn(), depth - 1).score;
      }
      if (diff >= best.score) {
        best = { score: diff, move };
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
    } = bestMove(state);
    const elapsed = performance.now() - t0;
    const maxiumum400 = Math.max(400 - elapsed, 0);
    setTimeout(() => {
      handleMove(finalRow, finalColumn, startRow, startColumn);
    }, maxiumum400);
  }, 50);
};
