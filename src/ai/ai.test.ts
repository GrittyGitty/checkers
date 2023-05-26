import { it, expect } from "vitest";
import { score } from "./engine";

import { Color } from "../types";
import { computeGridFromString, defaultSetup } from "../utils";

const base = computeGridFromString(defaultSetup.grid);

it("calculates score correctly", () => {
  let result = score(base, Color.black);
  expect(result).toBe(24);
  result = score(base, Color.red);
  expect(result).toBe(24);
});
