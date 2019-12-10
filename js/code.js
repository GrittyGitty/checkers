const pieces = ["black_piece", "black_king", "red_piece", "red_king", "empty"];
const colors = Array.from(new Set(pieces.slice(0, pieces.length - 1).map(value => value.split("_")[0])));

container = document.querySelector("#containerBoard");
trailDiv = document.querySelector("#trailingDiv");
turnDiv = document.querySelector("#turnDiv");


class GridUpdate {
    constructor(row, column, value = emptyPicIndex()) {
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
        this.table.addEventListener("mousedown", (event) => mouseDown(event));
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
        let currentUITable = container.querySelector("table");
        if (currentUITable !== null) currentUITable.remove();
        container.insertBefore(this.table, container.childNodes[0]);
        turnDiv.style.backgroundColor = this.currentTurn;
        return this;
    }

    static oppositeColor(color) {
        return color === colors[0] ? colors[1] : colors[0];
    }

    static getTableForGrid(grid) {
        let newTable = BoardState.createTable(grid.length, grid[0].length);
        let rowsIndices = Object.keys(grid);
        for (let row = 0; row < grid.length; row++) {
            for (let column = 0; column < grid[0].length; column++) {
                let cellVal = grid[row][column];
                let actualBoardCell = getActualTdDomElement(newTable, row, column);
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
        if (state.grid[upRow][upColumn] !== emptyPicIndex() || startCell === emptyPicIndex() || cellColor(startCell) !== state.currentTurn || (upRow === -1 && upColumn === -1))
            return state.updateUI();
        let flaggedCell = state.flaggedCell;
        if (flaggedCell !== undefined && ((downRow !== flaggedCell.row) || downColumn !== flaggedCell.column))
            return state.updateUI();

        let updates = [...checkMove(state.grid, upRow, upColumn, downRow, downColumn)];
        if (updates.length !== 0) { //was legal move...
            let updatedState = state.updateGrid(updates);
            let isEat = (updates.length === 3 && pieces[updates[updates.length - 1].value].split("_")[1] !== "king") || (updates.length === 4),
                canStillEat = (allTwoSquareMovesForCell(updatedState.grid, upRow, upColumn).length !== 0);
            state = (isEat && canStillEat) ? // was eat, and there are more eating options for the same cell
                updatedState.updateFlaggedCell({row: upRow, column: upColumn}) :
                updatedState.updateFlaggedCell().updateCurrentTurn();
            if (isColorLoss(state.grid, state.currentTurn)) {
                alert(`${state.currentTurn} lost! :(`);
                location.reload();
            }
        }
        state.updateUI();
    }
}


let gridString = `
40404040
04040444
40444040
44444444
44404040
24444404
42424240
24244444
`.trim().split("\n");
let grid = new Array(gridString.length).fill(new Array(gridString[0].length).fill(0)).map((row, rIndex) =>
    row.map((cell, cIndex) => Number(gridString[rIndex].charAt(cIndex)))
);

let state = new BoardState(grid, colors[1]);
state.updateUI();

function mouseDown(event) {
    let {row: downRow, column: downColumn} = getIndicesForMouseCoordinates(event);

    let trailDiv = document.getElementById("trailingDiv");

    container.addEventListener("mousemove", pieceDrag);
    container.addEventListener("mouseup", function mouseup(event) {
            removeTrailingPiece(event);
            let {row: upRow, column: upColumn} = getIndicesForMouseCoordinates(event);
            BoardState.handleMove(upRow, upColumn, downRow, downColumn);
            container.removeEventListener("mouseup", mouseup);
        }
    );

    function pieceDrag(event) {
        if (state.grid[downRow][downColumn] === emptyPicIndex())
            return;
        ({ width, height } = trailDiv.getBoundingClientRect());
        let cell = getActualTdDomElement(state.table, downRow,downColumn);
        //-------------UI CHANGE: Only For The Purposes Of Drag------------------
        state.updateGrid([new GridUpdate(downRow, downColumn, emptyPicIndex())]).updateUI();
        trailDiv.style.backgroundImage = cell.style.backgroundImage;
        trailDiv.style.top = event.clientY - height / 2 + "px";
        trailDiv.style.left = event.clientX - width / 2 + "px";
    }

    function removeTrailingPiece(event) {
        container.removeEventListener("mousemove", pieceDrag);
        trailDiv.style.backgroundImage = "";
        trailDiv.style.top = "-1000px";
        trailDiv.style.left = "-1000px";
    }
}

function getTableRelativeXandY() {

    ({width, height} = trailDiv.getBoundingClientRect());
    return {width, height};
}

function checkMove(grid, upRow, upColumn, downRow, downColumn) {
    let updates = [];
    let startCell = grid[downRow][downColumn];

    let notEatMoves = allOneSquareMovesForCell(grid, downRow, downColumn);
    let eatMoves = allTwoSquareMovesForCell(grid, downRow, downColumn);

    if (canAnyColoredCellEat(grid, cellColor(grid[downRow][downColumn]))) {
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
        updates.push(new GridUpdate(upRow, upColumn, pieces.indexOf(cellColor(startCell) + "_" + "king")));

    return updates;
}

function canAnyColoredCellEat(grid, color) {
    return allCellsForColor(grid, color).some(({row, column}) => allTwoSquareMovesForCell(grid, row, column).length > 0);
}


function cellColor(gridVal) {
    return gridVal !== emptyPicIndex() ? pieces[gridVal].split("_")[0] : "empty";
}


const possibleEatingDys = [2, -2];
const eatingDxs = [2, -2];

function allTwoSquareMovesForCell(grid, startRow, startColumn) {
    let possibleEatings = [];
    let startCell = grid[startRow][startColumn];
    if (startCell === emptyPicIndex())
        return possibleEatings;
    let eatingDys = pieces[startCell].includes("king") ? possibleEatingDys : [possibleEatingDys[colors.indexOf(cellColor(grid[startRow][startColumn]))]];
    for (let dy of eatingDys) {
        for (let dx of eatingDxs) {
            let finalRow = startRow + dy, finalColumn = startColumn + dx;
            if (rowOutOfBounds(finalRow) || columnOutOfBounds(finalColumn))
                continue;
            let finalCell = grid[finalRow][finalColumn];

            let oneBeforeRow = startRow + ((Math.abs(dy) - 1) * Math.sign(dy)),
                oneBeforeColumn = startColumn + ((Math.abs(dx) - 1) * Math.sign(dx));

            let oneBefore = grid[oneBeforeRow][oneBeforeColumn];

            if (finalCell === emptyPicIndex())
                if (cellColor(oneBefore) === BoardState.oppositeColor(cellColor(startCell))) {
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

const possibleMovingDys = [1, -1];
const movingDxs = [1, -1];

function allOneSquareMovesForCell(grid, startRow, startColumn) {
    let possibleMovings = [];
    let startCell = grid[startRow][startColumn];
    if (startCell === emptyPicIndex())
        return possibleMovings;
    let movingDys = pieces[startCell].includes("king") ? possibleMovingDys : [possibleMovingDys[colors.indexOf(cellColor(grid[startRow][startColumn]))]];
    for (let dy of movingDys) {
        for (let dx of movingDxs) {
            let finalRow = startRow + dy, finalColumn = startColumn + dx;
            if (rowOutOfBounds(finalRow) || columnOutOfBounds(finalColumn))
                continue;
            let finalCell = grid[finalRow][finalColumn];
            if (finalCell === emptyPicIndex())
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
            if (cellColor(grid[row][column]) === color)
                cells.push({row: Number(row), column: Number(column)});
        }
    }
    return cells;
}

function isColorLoss(grid, color) {
    return !allCellsForColor(grid, color).some(({row, column}) => allTwoSquareMovesForCell(grid, row, column).length > 0 || allOneSquareMovesForCell(grid, row, column).length > 0);
}


function emptyPicIndex() {
    return pieces.length - 1;
}

//not immutable!
function getActualTdDomElement(table, row, column) {
    return table.rows[row].cells[column];
}


function deepCopy2DArr(arr) {
    return arr.map(
        (row, rIndex) => row.map((column, cIndex) => column));
}


function indexOfImageAtURL(url) {
    return pieces[pieces.indexOf(url.match(/"pictures[/](.*)"/)[1])];

}

function rowOutOfBounds(...indices) {
    return indices.some(row => row > state.grid.length - 1 || row < 0);
}

function columnOutOfBounds(...indices) {
    return indices.some(column => column > state.grid[0].length || column < 0);
}