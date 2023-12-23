import { type BoardState } from "../classes/BoardState";
import { COMPUTER } from "../consts";
import { type Move, type StateControllers } from "../types";

import { enqueue } from "./workers";

const defaultBest = {
  score: 0,
  move: { finalColumn: 0, finalRow: 0, startColumn: 0, startRow: 0 },
};

async function bestMove(state: BoardState, depth: number): Promise<Move> {
  const moves = state.getAllLegalMovesForColor();
  if (moves.length === 1 && moves[0][1].length === 1) {
    const [{ row, column }, [{ finalCell }]] = moves[0];
    return {
      startRow: row,
      startColumn: column,
      finalRow: finalCell.row,
      finalColumn: finalCell.column,
    };
  }
  const candidates = await Promise.all(
    moves.flatMap(([{ row, column }, potentialMoves]) =>
      potentialMoves.map(
        ({ updates, finalCell: { row: finalRow, column: finalColumn } }) =>
          enqueue(state.updatedGrid(updates).updateCurrentTurn(), depth).then(
            (score) => ({
              move: {
                startRow: row,
                startColumn: column,
                finalRow,
                finalColumn,
              },
              score,
            }),
          ),
      ),
    ),
  );
  return candidates.reduce(
    (acc, cur) => (cur.score >= acc.score ? cur : acc),
    defaultBest,
  ).move;
}

export const doAiMove = (
  state: BoardState,
  handleMove: StateControllers["handleMove"],
  depth: number,
) => {
  if (state.turn !== COMPUTER) return;
  setTimeout(() => {
    const t0 = performance.now();
    bestMove(state, depth)
      .then(({ finalRow, finalColumn, startRow, startColumn }) => {
        const elapsed = performance.now() - t0;
        console.log(`Time elapsed: ${elapsed}ms`);
        const maxiumum400 = Math.max(200 - elapsed, 0);
        setTimeout(() => {
          handleMove(finalRow, finalColumn, startRow, startColumn);
        }, maxiumum400);
      })
      .catch(console.error);
  }, 50);
};
