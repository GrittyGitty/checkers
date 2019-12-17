const pieces = ["black_piece", "black_king", "red_piece", "red_king", "empty"];
const colors = Array.from(new Set(pieces.slice(0, pieces.length - 1).map(value => value.split("_")[0])));

let mainDiv = document.querySelector("#containerBoard");
let trailDiv = document.querySelector("#trailingDiv");
let turnDiv = document.querySelector("#turnDiv");
let g=8;

class GridUpdate {
    constructor(row, column, value = pieceIndexForEmptyCell()) {
        this.indices = {row: row, column: column};
        this.value = value;
    }

    static updateFactory(final, finalVal, ...remove) {
        let updates = [];
        updates.push(new GridUpdate(final.finalRow, final.finalColumn, finalVal));
        remove.forEach(({indices}) => updates.push(new GridUpdate(indices.row, indices.column)));
        return updates;
    }
}


class BoardState {
    constructor(grid, turnColor, flaggedCell = undefined) {
        this.grid = grid;
        this.currentTurn = turnColor;
        this.table = BoardState.getTableForGrid(grid);
        this.table.addEventListener("mousedown", (event) => mouseDownTable(event));
        this.flaggedCell = flaggedCell;
    }

    updateGrid(updates) {
        let newGrid = BoardState.computeGrid(this.grid, updates);
        return new BoardState(newGrid, this.currentTurn);
    }

    updateFlaggedCell(flagged = undefined) {
        return new BoardState(this.grid, this.currentTurn, flagged);
    }

    updateCurrentTurn() {
        let grid = this.grid;
        return new BoardState(grid, BoardState.oppositeColor(this.currentTurn));
    }

    updateUI() {
        let currentUITable = mainDiv.querySelector("table");
        if (currentUITable !== null) currentUITable.remove();
        mainDiv.insertBefore(this.table, mainDiv.childNodes[0]);
        turnDiv.style.backgroundColor = this.currentTurn;
        return this;
    }


    static oppositeColor(color) {
        return color === colors[0] ? colors[1] : colors[0];
    }

    static getTableForGrid(grid) {
        let newTable = BoardState.createTable(grid.length, grid[0].length);
        for (let row = 0; row < grid.length; row++) {
            for (let column = 0; column < grid[0].length; column++) {
                let cellVal = grid[row][column];
                let actualBoardCell = getActualCellReference(newTable, row, column);
                if (cellVal < pieces.length - 1) {
                    actualBoardCell.style.backgroundImage = `url('pictures/${pieces[grid[row][column]]}.png')`;
                    actualBoardCell.className += " tograb";
                }
            }
        }
        return newTable;
    }


    static createTable(rows, columns) {
        var table = document.createElement("table");
        for (let i = 0; i < rows; i++) {
            var row = document.createElement("tr");
            for (let j = 0; j < columns; j++) {
                var cell = document.createElement("td");
                if ((i + j) % 2 !== 0) {
                    cell.className = "colored";
                }
                row.appendChild(cell);
            }
            table.appendChild(row);
        }
        table.id = "table";
        return table;
    }

    static computeGrid(grid, update) {
        let gridCopy = deepCopy2DArr(grid);
        update.forEach(({indices: {row, column}, value}) => {
            gridCopy[row][column] = value;
        });
        return gridCopy;
    }

    static handleMove(upRow, upColumn, downRow, downColumn) {
        let startCell = state.grid[downRow][downColumn];
        if (state.grid[upRow][upColumn] !== pieceIndexForEmptyCell() || startCell === pieceIndexForEmptyCell() || colorForCell(startCell) !== state.currentTurn || (upRow === -1 && upColumn === -1))
            return state.updateUI();
        let flaggedCell = state.flaggedCell;
        if (flaggedCell !== undefined && ((downRow !== flaggedCell.row) || downColumn !== flaggedCell.column))
            return state.updateUI();

        let updates = [...generateGridUpdatesForMoveIfLegal(state.grid, upRow, upColumn, downRow, downColumn)];
        if (updates.length !== 0) { //was legal move...
            let updatedState = state.updateGrid(updates);
            let isTheMoveAnEatMove = (updates.length === 3 && pieces[updates[updates.length - 1].value].split("_")[1] !== "king") || (updates.length === 4),
                canTheMovingPieceStillEat = (allLegalEatingMovesForCell(updatedState.grid, upRow, upColumn).length !== 0);
            state = (isTheMoveAnEatMove && canTheMovingPieceStillEat) ? // was eat, and there are more eating options for the same cell
                updatedState.updateFlaggedCell({row: upRow, column: upColumn}) :
                updatedState.updateFlaggedCell().updateCurrentTurn();
            if (didColorLose(state.grid, state.currentTurn)) {
                alert(`${state.currentTurn} lost! :(`);
                location.reload();
            }
        }
        state.updateUI();
    }
}

// Set:  "-" (Empty), "b" (black piece), "B" (black king), "r" (red piece), "R" (red king)
let regularBoardSetup = changeGridStringToNumbers(`
-b-b-b-b
b-b-b-b-
-b-b-b-b
--------
--------
r-r-r-r-
-r-r-r-r
r-r-r-r-
`).trim().split("\n");
let grid = new Array(regularBoardSetup.length).fill(new Array(regularBoardSetup[0].length).fill(0)).map((row, rIndex) =>
    row.map((cell, cIndex) => Number(regularBoardSetup[rIndex].charAt(cIndex)))
);


let state = new BoardState(grid, colors[1]);
state.updateUI();


function mouseDownTable(event) {
    let {row: downRow, column: downColumn} = getIndicesForMouseCoordinates(event);

    let trailDiv = document.getElementById("trailingDiv");

    mainDiv.addEventListener("mousemove", pieceDrag);
    mainDiv.addEventListener("mouseup", function mouseup(event) {
            removeTrailingPiece(event);
            let {row: upRow, column: upColumn} = getIndicesForMouseCoordinates(event);
            BoardState.handleMove(upRow, upColumn, downRow, downColumn);
            mainDiv.removeEventListener("mouseup", mouseup);
        }
    );

    function pieceDrag(event) {
        if (state.grid[downRow][downColumn] === pieceIndexForEmptyCell())
            return;
        ({width, height} = trailDiv.getBoundingClientRect());
        let cell = getActualCellReference(state.table, downRow, downColumn);
        //-------------UI CHANGE: Only For The Purposes Of Drag------------------
        state.updateGrid([new GridUpdate(downRow, downColumn, pieceIndexForEmptyCell())]).updateUI();
        trailDiv.style.backgroundImage = cell.style.backgroundImage;
        trailDiv.style.top = event.clientY - height / 2 + "px";
        trailDiv.style.left = event.clientX - width / 2 + "px";
    }


    function removeTrailingPiece(event) {
        mainDiv.removeEventListener("mousemove", pieceDrag);
        trailDiv.style.backgroundImage = "";
        trailDiv.style.top = "-1000px";
        trailDiv.style.left = "-1000px";
    }
}

function generateGridUpdatesForMoveIfLegal(grid, upRow, upColumn, downRow, downColumn) {
    let updates = [];
    let startCell = grid[downRow][downColumn];

    let notEatMoves = allLegalNonEatingMovesForCell(grid, downRow, downColumn);
    let eatMoves = allLegalEatingMovesForCell(grid, downRow, downColumn);

    if (isThereAnEatingPossibilityForGivenColor(grid, colorForCell(grid[downRow][downColumn]))) {
        for (let move of eatMoves) {
            let finalCell = move.finalCell;
            if (finalCell.row === upRow && finalCell.column === upColumn)
                updates.push(...move.updates);
        }
    } else {
        for (let move of notEatMoves) {
            let finalCell = move.finalCell;
            if (finalCell.row === upRow && finalCell.column === upColumn) {
                updates.push(...move.updates);
            }
        }
    }

    if (((upRow === grid.length - 1) || (upRow === 0)) && updates.length > 0)
        updates.push(new GridUpdate(upRow, upColumn, pieces.indexOf(colorForCell(startCell) + "_" + "king")));

    return updates;
}

function isThereAnEatingPossibilityForGivenColor(grid, color) {
    return allCellsForColor(grid, color).some(({row, column}) => allLegalEatingMovesForCell(grid, row, column).length > 0);
}


function colorForCell(gridVal) {
    return gridVal !== pieceIndexForEmptyCell() ? pieces[gridVal].split("_")[0] : "empty";
}


function allLegalEatingMovesForCell(grid, startRow, startColumn) {
    const possibleEatingDys = [2, -2];
    const eatingDxs = [2, -2];
    let possibleEatings = [];
    let startCell = grid[startRow][startColumn];

    if (startCell === pieceIndexForEmptyCell())
        return possibleEatings;
    const eatingDys = pieces[startCell].includes("king") ? possibleEatingDys : [possibleEatingDys[colors.indexOf(colorForCell(grid[startRow][startColumn]))]];

    for (let dy of eatingDys) {
        for (let dx of eatingDxs) {
            let finalRow = startRow + dy, finalColumn = startColumn + dx;
            if (areRowsOutOfBounds(finalRow) || areColumnsOutOfBounds(finalColumn))
                continue;
            let finalCell = grid[finalRow][finalColumn];

            let oneBeforeRow = startRow + ((Math.abs(dy) - 1) * Math.sign(dy)),
                oneBeforeColumn = startColumn + ((Math.abs(dx) - 1) * Math.sign(dx));

            let oneBefore = grid[oneBeforeRow][oneBeforeColumn];

            if (finalCell === pieceIndexForEmptyCell())
                if (colorForCell(oneBefore) === BoardState.oppositeColor(colorForCell(startCell))) {
                    possibleEatings.push({
                        finalCell: {row: finalRow, column: finalColumn},
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


function allLegalNonEatingMovesForCell(grid, startRow, startColumn) {
    const possibleMovingDys = [1, -1];
    const movingDxs = [1, -1];

    let possibleMovings = [];
    let startCell = grid[startRow][startColumn];
    if (startCell === pieceIndexForEmptyCell())
        return possibleMovings;
    const movingDys = pieces[startCell].includes("king") ? possibleMovingDys : [possibleMovingDys[colors.indexOf(colorForCell(grid[startRow][startColumn]))]];

    for (let dy of movingDys) {
        for (let dx of movingDxs) {
            let finalRow = startRow + dy, finalColumn = startColumn + dx;
            if (areRowsOutOfBounds(finalRow) || areColumnsOutOfBounds(finalColumn))
                continue;
            let finalCell = grid[finalRow][finalColumn];
            if (finalCell === pieceIndexForEmptyCell())
                possibleMovings.push({
                    finalCell: {row: finalRow, column: finalColumn},
                    updates: GridUpdate.updateFactory({
                        finalRow,
                        finalColumn
                    }, startCell, new GridUpdate(startRow, startColumn))
                });
        }
    }
    return possibleMovings;
}


function getIndicesForMouseCoordinates(event) {
    let tableParams = document.querySelector("#table").getBoundingClientRect();
    let subtractFromX = tableParams.left + window.pageXOffset;
    let subtractFromY = tableParams.top + window.pageYOffset;
    let x = event.clientX - subtractFromX, y = event.clientY - subtractFromY, width = tableParams.width,
        height = tableParams.height;

    if (x > width || y > height)
        return {row: -1, column: -1};
    let rows = state.grid.length;
    let columns = state.grid[0].length;
    return {
        row: Math.floor((y / height) * rows),
        column: Math.floor((x / width) * columns)
    };
}

function allCellsForColor(grid, color) {
    let cells = [];
    for (let row of Object.keys(grid)) {
        for (let column of Object.keys(grid[row])) {
            if (colorForCell(grid[row][column]) === color)
                cells.push({row: Number(row), column: Number(column)});
        }
    }
    return cells;
}

function didColorLose(grid, color) {
    return !allCellsForColor(grid, color).some(({row, column}) => allLegalEatingMovesForCell(grid, row, column).length > 0 || allLegalNonEatingMovesForCell(grid, row, column).length > 0);
}


function pieceIndexForEmptyCell() {
    return pieces.length - 1;
}

//not immutable!
function getActualCellReference(table, row, column) {
    return table.rows[row].cells[column];
}


function deepCopy2DArr(arr) {
    return arr.map(
        (row, rIndex) => row.map((column, cIndex) => column));
}


function areRowsOutOfBounds(...indices) {
    return indices.some(row => row > state.grid.length - 1 || row < 0);
}

function areColumnsOutOfBounds(...indices) {
    return indices.some(column => column > state.grid[0].length || column < 0);
}

function changeGridStringToNumbers(gridstring) {
    return gridstring
        .replace(/-/g, `${pieceIndexForEmptyCell()}`)
        .replace(/b/g, "0")
        .replace(/B/g, "1")
        .replace(/r/g, "2")
        .replace(/R/g, "3");
}


//experimental
/*function registerEventsForTableCells(table, tdClassName, events, func, ...args) {
    for (let i = 0, row; row = table.rows[i]; i++) {
        for (let j = 0, col; col = row.cells[j]; j++) {
            let cell = getActualCellReference(table, i, j);
            if (cell.className.includes(tdClassName)) {
                for (let event of events)
                    cell.addEventListener(event, func(...args, i, j));
            }
        }
    }
}
function highlight(table, grid, row, column) {
    let moves = allTwoSquareMovesForCell(grid, row, column);
    if (moves.length === 0 && !canAnyColoredCellEat(grid, cellColor(grid[row][column]))) {
        moves = allOneSquareMovesForCell(grid, row, column);
    }
    for (let {row, column} of moves.map(move => move.finalCell)) {
        let cell = getActualTdDomElement(table, row, column);
        let regexp = /possibleMovingPoints/;
        if (regexp.test(cell.className)) {
            cell.className = cell.className.replace("possibleMovingPoints", "");
        } else
            cell.className += " possibleMovingPoints";
    }
}*/
