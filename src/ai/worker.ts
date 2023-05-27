import { BoardState } from "../classes/BoardState";

import { bestScore } from "./bestScore";
import { type FinishedWork } from "./workers";

self.addEventListener("message", (e) => {
  const state = BoardState.deserialize(e.data);
  const stringGrid = String(state.grid);
  const score = bestScore(state);
  const final: FinishedWork = {
    score,
    stringGrid,
  };
  postMessage(final);
});
