import { type BoardState } from "../classes/BoardState";
import { forEachCell, gridValToColor } from "../utils";

const valueToScore = [1, 1.2, 1, 1.2, 0] as const;
const calculateScore = ({ grid, turn }: BoardState) => {
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
if (ODD_DEPTH % 2 === 0) throw new Error("Depth must be odd");

export function bestScore(state: BoardState, depth = ODD_DEPTH) {
  if (!depth) return calculateScore(state);

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
