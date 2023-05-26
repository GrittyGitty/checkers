import { it, expect } from "vitest";
import { calculateScore } from "./engine";

import { Color } from "../types";
import { computeGridFromString, defaultSetup } from "../utils";
import { BoardState } from "../classes/BoardState";

const base = new BoardState(
  computeGridFromString(defaultSetup.grid),
  Color.black
);

it("calculates score correctly", () => {
  let result = calculateScore(base);
  expect(result).toBe(0);
  result = calculateScore(base);
  expect(result).toBe(0);
});
