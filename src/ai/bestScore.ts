import { type BoardState } from "../classes/BoardState";
import { Color } from "../types";
import { assert, forEachCell, gridValToColor } from "../utils";

/** side bonus */
export const S = 1.5;
/** center bonus */
export const C = 2;
/** back row bonus - a little less than king bonus,
 * saw somewhere that offensive strategies are more successful shrug */
export const B = 4;
/** king bonus */
const K = 5;
/** regular */
export const R = 10;

export const KING = K + R;
const valueToScore = [R, KING, R, KING, 0] as const;

const bonuses = [
  [0, B, 0, B, 0, B, 0, B],
  [S, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, S],
  [S, 0, C, 0, C, 0, 0, 0],
  [0, 0, 0, C, 0, C, 0, S],
  [S, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, S],
  [B, 0, B, 0, B, 0, B, 0],
] as const;

const calculateBonus = (
  r: number,
  c: number,
  color: Color,
  turn: Color,
): number => {
  const potentialBonus = bonuses[r][c];
  /** Laziest way to do this. TODO: assert so this doesn't happen. */
  if (potentialBonus === S)
    return turn === color ? potentialBonus : -potentialBonus;
  if (r <= 3 && color === Color.red)
    return turn === Color.red ? potentialBonus : -potentialBonus;
  if (r >= 4 && color === Color.black)
    return turn === Color.black ? potentialBonus : -potentialBonus;
  return 0;
};

export const calculateScore = ({ grid, turn }: BoardState) => {
  let score = 0;
  forEachCell((r, c) => {
    const cell = grid[r][c];
    const color = gridValToColor[cell];
    if (!color) return;
    const value = valueToScore[cell];
    const bonus = calculateBonus(r, c, color, turn);
    score += (color === turn ? value : -value) + bonus;
  });
  return score;
};

export function bestScore(state: BoardState, depth: number) {
  let max = 0;
  const work = [{ state, depth }];
  let item: (typeof work)[number] | undefined;
  while (work.length > 0) {
    item = work.pop();
    assert(item);
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
