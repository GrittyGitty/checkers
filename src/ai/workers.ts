import { type BoardState } from "../classes/BoardState";

import Worker from "./worker?worker";

const WORKERS = window.navigator.hardwareConcurrency + 2;
const pool = Array.from({ length: WORKERS }, () => new Worker());

let i = 0;
const getWorker = () => {
  const next = pool[i];
  i = (i + 1) % WORKERS;
  return next;
};

export type FinishedWork = {
  score: number;
  stringGrid: string;
};

export type InitWork = {
  depth: number;
  state: BoardState;
};

export const enqueue = (state: BoardState, depth: number): Promise<number> =>
  new Promise((resolve) => {
    const worker = getWorker();
    const initialStringGrid = String(state.grid);
    worker.addEventListener("message", onMessage);
    const initWork: InitWork = { state, depth };
    worker.postMessage(initWork);

    function onMessage({
      data: { score, stringGrid },
    }: MessageEvent<FinishedWork>) {
      if (initialStringGrid === stringGrid) {
        resolve(score);
        worker.removeEventListener("message", onMessage);
      }
    }
  });
