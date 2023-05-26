import { type BoardState } from "../classes/BoardState";
import { Color, type Grid } from "../types";
import { forEachCell, gridValToColor } from "../utils";

const print = (state: BoardState) => {
  console.log(state.serialize().grid);
};

const normalize = [];
export const score = (grid: Grid, color: Color) => {
  let sum = 0;
  const normalize = color === Color.black ? 2 : 0;
  forEachCell((r, c) => {
    const cell = grid[r][c];
    if (gridValToColor[cell] === color) sum += cell + normalize;
  });
  return sum;
};

const predict = (grid: Grid) => {};

export const next = (state: BoardState) => {
  print(state);
};
