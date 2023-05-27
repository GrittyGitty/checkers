import { it, expect } from "vitest";

import { Color } from "../types";
import { computeGridFromString, defaultSetup } from "../utils";
import { BoardState } from "../classes/BoardState";
import { calculateScore } from "./bestScore";

const base = new BoardState({
  grid: computeGridFromString(defaultSetup.grid),
  turn: Color.black,
});

it("calculates score correctly", () => {
  let result = calculateScore(base);
  expect(result).toBe(0);
  result = calculateScore(base);
  expect(result).toBe(0);
});
