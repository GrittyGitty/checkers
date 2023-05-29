import { bench, describe } from "vitest";
import { BoardState } from "../classes/BoardState";
import { Color } from "../types";
import { computeGridFromString } from "../utils";
import { bestScore, calculateScore } from "./bestScore";

const state = new BoardState({
  grid: computeGridFromString(`
-r-r-r-r
r-r-r-r-
-r-r-r-r
--------
---b----
b-b---b-
-b-b-b-b
b-b-b-b-`),
  turn: Color.red,
});

describe("bestScore", () => {
  bench("normal", () => {
    bestScore(state, 7);
  });
});

describe("calculateScore", () => {
  bench("calculate score", () => {
    calculateScore(state);
  });
});
