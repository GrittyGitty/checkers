import { colors, EMPTY_VALUE, pieces } from "./consts";
import { Color, type Grid } from "./types";

export function forEachCell(cb: (row: number, column: number) => void) {
  for (let row = 0; row < 8; row++) {
    for (let column = 0; column < 8; column++) {
      cb(row, column);
    }
  }
}

export const gridValToColor = pieces.map((_, gridVal) =>
  gridVal !== EMPTY_VALUE ? (pieces[gridVal].split("-")[0] as Color) : undefined
);

export function changeGridStringToNumbers(gridstring: string) {
  return ["b", "B", "r", "R", "-"].reduce(
    (grid, alias, i) => grid.replaceAll(alias, String(i)),
    gridstring
  );
}

export function oppositeColor(color?: Color) {
  return color === colors[0] ? colors[1] : colors[0];
}

export const defaultSetup = {
  turn: Color.black,
  grid: `
-r-r-r-r
r-r-r-r-
-r-r-r-r
--------
--------
b-b-b-b-
-b-b-b-b
b-b-b-b-
`
    .trim()
    .split("\n")
    .filter(Boolean)
    .join("\n"),
};

export const computeGridFromString = (grid: string): Grid => {
  const regularBoardSetup = changeGridStringToNumbers(grid)
    .trim()
    .split("\n")
    .map((r) => r.trim());
  const raw: Grid = Array.from({ length: 8 }, () => Array.from({ length: 8 }));
  return raw.map((row, rIndex) =>
    row.map((_, cIndex) => Number(regularBoardSetup[rIndex].charAt(cIndex)))
  );
};

export const assert = (condition: boolean, msg?: string): asserts condition => {
  if (!condition) {
    throw new Error(msg);
  }
};
