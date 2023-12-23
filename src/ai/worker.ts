import { BoardState } from "../classes/BoardState";

import { bestScore } from "./bestScore";
import { type FinishedWork, type InitWork } from "./workers";

self.addEventListener("message", ({ data }: { data: InitWork }) => {
  const state = BoardState.deserialize(data.state);
  const stringGrid = String(state.grid);
  const score = bestScore(state, data.depth);
  const final: FinishedWork = {
    score,
    stringGrid,
  };
  postMessage(final);
});
