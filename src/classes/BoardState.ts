import { eatingDys, EMPTY_VALUE, movingDys, pieces } from "../consts";
import { GridUpdate, type PotentialMoves } from "./GridUpdate";
import {
  type Move,
  type Cell,
  type Color,
  type FinalCell,
  type Grid,
  type SerializedState,
  type StartCell,
} from "../types";
import { forEachCell, gridValToColor, oppositeColor } from "../utils";

export function generateGridUpdatesForMoveIfLegal(
  boardState: BoardState,
  { finalRow, finalColumn, startRow, startColumn }: FinalCell & StartCell
) {
  const logicalMoves = allLogicalLegalMovesForCell(boardState, {
    startRow,
    startColumn,
  });
  const specificMove = logicalMoves.find(
    ({ finalCell }) =>
      finalCell.row === finalRow && finalCell.column === finalColumn
  );
  if (specificMove == null) return [];

  const { updates } = specificMove;

  if ((finalRow === 7 || finalRow === 0) && updates.length > 0) {
    updates.push(
      new GridUpdate(
        finalRow,
        finalColumn,
        pieces.indexOf(
          `${
            gridValToColor[boardState.grid[startRow][startColumn]] as string
          }-` + "king"
        )
      )
    );
  }

  return updates;
}

function allLogicalLegalMovesForCell(
  { grid, turn }: BoardState,
  { startRow, startColumn }: StartCell
) {
  const startCell = grid[startRow][startColumn];
  if (startCell === EMPTY_VALUE || gridValToColor[startCell] !== turn) {
    return [];
  }
  return isThereAnEatingPossibilityForGivenColor(
    grid,
    gridValToColor[grid[startRow][startColumn]]
  )
    ? allLegalEatingMovesForCell(grid, startRow, startColumn)
    : allLegalNonEatingMovesForCell(grid, startRow, startColumn);
}

function isThereAnEatingPossibilityForGivenColor(grid: Grid, color?: Color) {
  return allCellsForColor(grid, color).some(
    ({ row, column }) =>
      allLegalEatingMovesForCell(grid, row, column).length > 0
  );
}

export function allLegalEatingMovesForCell(
  grid: Grid,
  startRow: number,
  startColumn: number
) {
  const eatingDxs = [2, -2];
  const possibleEatings: PotentialMoves = [];
  const startCell = grid[startRow][startColumn];

  if (startCell === EMPTY_VALUE) {
    return possibleEatings;
  }

  for (const dy of eatingDys[startCell]) {
    for (const dx of eatingDxs) {
      const finalRow = startRow + dy;
      const finalColumn = startColumn + dx;
      if (areRowsOutOfBounds(finalRow) || areColumnsOutOfBounds(finalColumn)) {
        continue;
      }
      const finalCell = grid[finalRow][finalColumn];

      const oneBeforeRow = startRow + (Math.abs(dy) - 1) * Math.sign(dy);
      const oneBeforeColumn = startColumn + (Math.abs(dx) - 1) * Math.sign(dx);

      const oneBefore = grid[oneBeforeRow][oneBeforeColumn];

      if (finalCell === EMPTY_VALUE) {
        if (
          gridValToColor[oneBefore] === oppositeColor(gridValToColor[startCell])
        ) {
          possibleEatings.push({
            finalCell: { row: finalRow, column: finalColumn },
            updates: GridUpdate.updateFactory(
              {
                finalRow,
                finalColumn,
              },
              startCell,
              new GridUpdate(oneBeforeRow, oneBeforeColumn),
              new GridUpdate(startRow, startColumn)
            ),
          });
        }
      }
    }
  }
  return possibleEatings;
}

function allCellsForColor(grid: Grid, color?: Color) {
  const cells: Cell[] = [];
  forEachCell((row: number, column: number) => {
    if (gridValToColor[grid[row][column]] === color) {
      cells.push({ row, column });
    }
  });
  return cells;
}

export function didColorLose(grid: Grid, color: Color) {
  return !allCellsForColor(grid, color).some(
    ({ row, column }) =>
      allLegalEatingMovesForCell(grid, row, column).length > 0 ||
      allLegalNonEatingMovesForCell(grid, row, column).length > 0
  );
}

const deepGridCopy = (arr: Grid): Grid =>
  arr.map((r) => r.map((c) => c)) as Grid;

function areRowsOutOfBounds(...indices: number[]) {
  return indices.some((row) => row >= 8 || row < 0);
}

function areColumnsOutOfBounds(...indices: number[]) {
  return indices.some((column) => column >= 8 || column < 0);
}

function allLegalNonEatingMovesForCell(
  grid: Grid,
  startRow: number,
  startColumn: number
) {
  const movingDxs = [1, -1];

  const possibleMovings: PotentialMoves = [];
  const startCell = grid[startRow][startColumn];
  if (startCell === EMPTY_VALUE) {
    return possibleMovings;
  }

  for (const dy of movingDys[startCell]) {
    for (const dx of movingDxs) {
      const finalRow = startRow + dy;
      const finalColumn = startColumn + dx;
      if (areRowsOutOfBounds(finalRow) || areColumnsOutOfBounds(finalColumn)) {
        continue;
      }
      const finalCell = grid[finalRow][finalColumn];
      if (finalCell === EMPTY_VALUE) {
        possibleMovings.push({
          finalCell: { row: finalRow, column: finalColumn },
          updates: GridUpdate.updateFactory(
            {
              finalRow,
              finalColumn,
            },
            startCell,
            new GridUpdate(startRow, startColumn)
          ),
        });
      }
    }
  }
  return possibleMovings;
}

export class BoardState {
  grid: Grid;
  turn: Color;
  flaggedCell?: Cell;
  piecesThatCanMove: Cell[];
  lastMove?: Move;

  constructor({
    grid,
    turn,
    flaggedCell,
    lastMove,
  }: {
    flaggedCell?: Cell;
    lastMove?: Move;
    grid: Grid;
    turn: Color;
  }) {
    this.grid = grid;
    this.turn = turn;
    this.flaggedCell = flaggedCell;
    this.lastMove = lastMove;
    this.piecesThatCanMove = this.getPiecesThatCanMove();
  }

  updatedGrid(updates: GridUpdate[]) {
    return new BoardState({
      ...this,
      grid: BoardState.computeGrid(this.grid, updates),
    });
  }

  updateFlaggedCell(flaggedCell?: Cell) {
    return new BoardState({ ...this, flaggedCell });
  }

  updateLastMove(lastMove: Move) {
    return new BoardState({ ...this, lastMove });
  }

  updateCurrentTurn() {
    return new BoardState({
      ...this,
      grid: this.grid,
      turn: oppositeColor(this.turn),
    });
  }

  getAllLegalMovesForColor() {
    return allCellsForColor(this.grid, this.turn).map(
      (cell) =>
        [
          cell,
          allLogicalLegalMovesForCell(this, {
            startRow: cell.row,
            startColumn: cell.column,
          }),
        ] as const
    );
  }

  getPiecesThatCanMove() {
    return (
      this.flaggedCell != null
        ? [this.flaggedCell]
        : allCellsForColor(this.grid, this.turn)
    ).filter(({ row, column }) => this.getLegalTargets(row, column).length);
  }

  getLegalTargets(startRow: number, startColumn: number) {
    return allLogicalLegalMovesForCell(this, { startRow, startColumn }).map(
      ({ finalCell }) => finalCell
    );
  }

  static computeGrid(grid: Grid, updates: GridUpdate[]) {
    const gridCopy = deepGridCopy(grid);
    updates.forEach(({ indices: { row, column }, value }) => {
      gridCopy[row][column] = value;
    });
    return gridCopy;
  }

  serialize(): SerializedState {
    const classToAlias = ["b", "B", "r", "R", "-"];
    return {
      grid: this.grid
        .map((r) => {
          return r.map((c) => classToAlias[c]).join("");
        })
        .join("\n"),
      turn: this.turn,
    };
  }

  /**
   * From serialized state, in worker
   */
  static deserialize(serialized: {
    [K in keyof BoardState]: BoardState[K];
  }): BoardState {
    return new BoardState(serialized);
  }
}
