import { bench, describe } from "vitest";
import { BoardState } from "../classes/BoardState";
import { Color } from "../types";
import { computeGridFromString } from "../utils";
import { bestScore } from "./bestScore";

describe("bestScore", () => {
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
  bench("normal", () => {
    bestScore(state);
  });
});
