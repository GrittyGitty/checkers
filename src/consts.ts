import { Color } from "./types";

const pieces = ["black", "black-king", "red", "red-king", "empty"];
const movingDys = [[-1], [-1, 1], [1], [-1, 1]];
const eatingDys = movingDys.map((dirs) => dirs.map((d) => d * 2));
const colors = [Color.black, Color.red] as const;
const EMPTY_VALUE = pieces.length - 1;

const COMPUTER = Color.red;

export { pieces, movingDys, eatingDys, colors, EMPTY_VALUE, COMPUTER };
