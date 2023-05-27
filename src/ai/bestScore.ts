import { type BoardState } from "../classes/BoardState";
import { forEachCell, gridValToColor } from "../utils";

const valueToScore = [1, 1, 1, 1, 0] as const;
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

export function bestScore(state: BoardState, depth: number) {
  let max = 0;
  const work = [{ state, depth }];
  let item: (typeof work)[number] | undefined;
  while ((item = work.pop())) {
    const { state, depth } = item;
    if (!depth) {
      const score = calculateScore(state);
      if (score >= max) max = score;
      continue;
    }
    for (const [, potentialMoves] of state.getAllLegalMovesForColor()) {
      for (const { updates } of potentialMoves) {
        work.push({
          state: state.updatedGrid(updates).updateCurrentTurn(),
          depth: depth - 1,
        });
      }
    }
  }

  return max;
}
