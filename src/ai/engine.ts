import { type BoardState } from "../classes/BoardState";
import { COMPUTER } from "../consts";
import { type StateControllers } from "../types";

import { enqueue } from "./workers";

const defaultBest = {
  score: 0,
  move: { finalColumn: 0, finalRow: 0, startColumn: 0, startRow: 0 },
};

async function bestMove(state: BoardState) {
  const candidates = await Promise.all(
    state
      .getAllLegalMovesForColor()
      .flatMap(([{ row, column }, potentialMoves]) =>
        potentialMoves.map(
          ({ updates, finalCell: { row: finalRow, column: finalColumn } }) =>
            enqueue(state.updatedGrid(updates).updateCurrentTurn()).then(
              (score) => ({
                move: {
                  startRow: row,
                  startColumn: column,
                  finalRow,
                  finalColumn,
                },
                score,
              })
            )
        )
      )
  );
  return candidates.reduce(
    (acc, cur) => (cur.score >= acc.score ? cur : acc),
    defaultBest
  ).move;
}

export const doAiMove = (
  state: BoardState,
  handleMove: StateControllers["handleMove"]
) => {
  if (state.turn !== COMPUTER) return;
  setTimeout(() => {
    const t0 = performance.now();
    bestMove(state)
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
