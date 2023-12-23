import { expect, it } from "vitest";

import { BoardState } from "../classes/BoardState";
import { Color } from "../types";
import { computeGridFromString, defaultSetup } from "../utils";
import { B, C, KING, R, S, calculateScore } from "./bestScore";

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

const state = new BoardState({
  grid: computeGridFromString(`
-r-r-r-r
r-r-r-r-
-r-r-r-r
--------
---b----
b-------
--------
--------`),
  turn: Color.red,
});

it("calculates score correctly", () => {
  const result = calculateScore(state);
  const regular = 12 * R;
  const backRow = 4 * B;
  const side = 2 * S;

  const black = 2 * R;
  const blackSide = 1 * S;
  const blackCenter = 1 * C;
  expect(result).toBe(
    regular + backRow + side - black - blackSide - blackCenter,
  );
});

const state2 = new BoardState({
  grid: computeGridFromString(`
-b-r-r-r
r-r-r-r-
-r-r-r-r
--------
---B----
b-------
-------b
r-------`),
  turn: Color.red,
});

it("calculates score correctly", () => {
  const result = calculateScore(state2);
  const redScore = 12 * R + 0 * KING + 2 * S + 3 * B + 0 * C;
  const blackScore = 3 * R + 1 * KING + 2 * S + 0 * B + 1 * C;
  expect(result).toBe(redScore - blackScore);
});
