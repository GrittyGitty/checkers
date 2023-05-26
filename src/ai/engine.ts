import {
  generateGridUpdatesForMoveIfLegal,
  type BoardState,
} from "../classes/BoardState";

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

const DEPTH = 1;

function diffs(state: BoardState, currentScore: number) {
  for (const { row, column } of state.getPiecesThatCanMove()) {
    for (const { row: finalRow, column: finalColumn } of state.getLegalTargets(
      row,
      column
    )) {
      const updates = generateGridUpdatesForMoveIfLegal(state, {
        finalRow,
        finalColumn,
        startRow: row,
        startColumn: column,
      });
      const newState = state.updatedGrid(updates);
      const score = calculateScore(newState);
      const diff = score - currentScore;
    }
  }
}

export const next = (state: BoardState) => {
  const currentScore = calculateScore(state);
  diffs(state, currentScore);
};
