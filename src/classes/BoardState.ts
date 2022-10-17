import { eatingDys, EMPTY_VALUE, movingDys, pieces } from "../consts";
import { GridUpdate, PotentialMoves } from "./GridUpdate";
import { Cell, Color, FinalCell, Grid, SerializedState, StartCell } from "../types";
import { colorForCell, forEachCell, oppositeColor } from "../utils";


export function generateGridUpdatesForMoveIfLegal(boardState: BoardState, { finalRow, finalColumn, startRow, startColumn }: FinalCell & StartCell) {
  const logicalMoves = allLogicalLegalMovesForCell(boardState, { startRow, startColumn });
  const specificMove = logicalMoves.find((({ finalCell }) => finalCell.row === finalRow && finalCell.column === finalColumn))
  if (!specificMove) return [];

  const { updates } = specificMove;

  if (((finalRow === 7) || (finalRow === 0)) && updates.length > 0)
    updates.push(new GridUpdate(finalRow, finalColumn, pieces.indexOf(colorForCell(boardState.grid[startRow][startColumn]) + "-" + "king")));

  return updates;
}

function allLogicalLegalMovesForCell({ grid, turn }: BoardState, { startRow, startColumn }: StartCell) {
  const startCell = grid[startRow][startColumn];
  if (startCell === EMPTY_VALUE || colorForCell(startCell) !== turn
  )
    return [];
  return isThereAnEatingPossibilityForGivenColor(grid, colorForCell(grid[startRow][startColumn]))
    ? allLegalEatingMovesForCell(grid, startRow, startColumn)
    : allLegalNonEatingMovesForCell(grid, startRow, startColumn)
}

function isThereAnEatingPossibilityForGivenColor(grid: Grid, color?: Color) {
  return allCellsForColor(grid, color).some(({ row, column }) => allLegalEatingMovesForCell(grid, row, column).length > 0);
}



export function allLegalEatingMovesForCell(grid: Grid, startRow: number, startColumn: number) {
  const eatingDxs = [2, -2];
  const possibleEatings: PotentialMoves = [];
  const startCell = grid[startRow][startColumn];

  if (startCell === EMPTY_VALUE)
    return possibleEatings;

  for (let dy of eatingDys[startCell]) {
    for (let dx of eatingDxs) {
      let finalRow = startRow + dy, finalColumn = startColumn + dx;
      if (areRowsOutOfBounds(finalRow) || areColumnsOutOfBounds(finalColumn))
        continue;
      let finalCell = grid[finalRow][finalColumn];

      let oneBeforeRow = startRow + ((Math.abs(dy) - 1) * Math.sign(dy)),
        oneBeforeColumn = startColumn + ((Math.abs(dx) - 1) * Math.sign(dx));

      let oneBefore = grid[oneBeforeRow][oneBeforeColumn];

      if (finalCell === EMPTY_VALUE)
        if (colorForCell(oneBefore) === oppositeColor(colorForCell(startCell))) {
          possibleEatings.push({
            finalCell: { row: finalRow, column: finalColumn },
            updates: GridUpdate.updateFactory({
              finalRow,
              finalColumn
            }, startCell, new GridUpdate(oneBeforeRow, oneBeforeColumn), new GridUpdate(startRow, startColumn))
          });
        }
    }
  }
  return possibleEatings;
}


function allCellsForColor(grid: Grid, color?: Color) {
  const cells: Cell[] = [];
  forEachCell((row: number, column: number) => {
    if (colorForCell(grid[row][column]) === color)
      cells.push({ row, column })
  })
  return cells;
}

export function didColorLose(grid: Grid, color: Color) {
  return !allCellsForColor(grid, color).some(({ row, column }) => allLegalEatingMovesForCell(grid, row, column).length > 0 || allLegalNonEatingMovesForCell(grid, row, column).length > 0);
}

const deepGridCopy = (arr: Grid): Grid => arr.map((r) => r.map((c) => c)) as Grid;


function areRowsOutOfBounds(...indices: number[]) {
  return indices.some(row => row >= 8 || row < 0);
}

function areColumnsOutOfBounds(...indices: number[]) {
  return indices.some(column => column >= 8 || column < 0);
}

function allLegalNonEatingMovesForCell(grid: Grid, startRow: number, startColumn: number) {
  const movingDxs = [1, -1];

  let possibleMovings: PotentialMoves = [];
  let startCell = grid[startRow][startColumn];
  if (startCell === EMPTY_VALUE)
    return possibleMovings;

  for (let dy of movingDys[startCell]) {
    for (let dx of movingDxs) {
      let finalRow = startRow + dy, finalColumn = startColumn + dx;
      if (areRowsOutOfBounds(finalRow) || areColumnsOutOfBounds(finalColumn))
        continue;
      let finalCell = grid[finalRow][finalColumn];
      if (finalCell === EMPTY_VALUE)
        possibleMovings.push({
          finalCell: { row: finalRow, column: finalColumn },
          updates: GridUpdate.updateFactory({
            finalRow,
            finalColumn
          }, startCell, new GridUpdate(startRow, startColumn))
        });
    }
  }
  return possibleMovings;
}




export class BoardState {
  grid: Grid;
  turn: Color;
  flaggedCell?: Cell;
  piecesThatCanMove: Cell[];

  constructor(grid: Grid, turnColor: Color, { flaggedCell }: { flaggedCell?: Cell; } = {}) {
    this.grid = grid;
    this.turn = turnColor;
    this.flaggedCell = flaggedCell;
    this.piecesThatCanMove = this.getPiecesThatCanMove();
  }

  updatedGrid(updates: GridUpdate[]) {
    let newGrid = BoardState.computeGrid(this.grid, updates);
    return new BoardState(newGrid, this.turn);
  }

  updateFlaggedCell(flaggedCell?: Cell) {
    return new BoardState(this.grid, this.turn, { flaggedCell });
  }

  updateCurrentTurn() {
    let grid = this.grid;
    return new BoardState(grid, oppositeColor(this.turn));
  }

  getPiecesThatCanMove() {
    return (this.flaggedCell
      ? [this.flaggedCell]
      : allCellsForColor(this.grid, this.turn))
      .filter(({ row, column }) => this.getLegalTargets(row, column).length);
  }

  getLegalTargets(startRow: number, startColumn: number) {
    return allLogicalLegalMovesForCell(this, { startRow, startColumn }).map(({ finalCell }) => finalCell);
  }

  static computeGrid(grid: Grid, updates: GridUpdate[]) {
    let gridCopy = deepGridCopy(grid);
    updates.forEach(({ indices: { row, column }, value }) => {
      gridCopy[row][column] = value;
    });
    return gridCopy;
  }


  serialize(): SerializedState {
    const classToAlias = ["b", "B", "r", "R", "-"];
    return {
      grid: this.grid.map((r) => {
        return r.map((c) => classToAlias[c]).join("");
      }).join("\n"),
      turn: this.turn
    };
  }
}

