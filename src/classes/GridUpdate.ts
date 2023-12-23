import { EMPTY_VALUE } from "../consts";
import { type Cell, type FinalCell } from "../types";

export class GridUpdate {
  indices: Cell;
  value: number;

  constructor(row: number, column: number, value = EMPTY_VALUE) {
    this.indices = { row, column };
    this.value = value;
  }

  static updateFactory(
    final: FinalCell,
    finalVal: number,
    ...remove: GridUpdate[]
  ) {
    const updates = [];
    updates.push(new GridUpdate(final.finalRow, final.finalColumn, finalVal));
    for (const { indices } of remove) {
      updates.push(new GridUpdate(indices.row, indices.column));
    }
    return updates;
  }
}

export type PotentialMoves = Array<{
  finalCell: Cell;
  updates: GridUpdate[];
}>;
