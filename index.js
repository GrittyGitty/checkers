const pieces = ["black", "black-king", "red", "red-king", "empty"];
const colors = ["black", "red"];

let mainDiv = document.querySelector("#containerBoard");
let trailDiv = document.querySelector("#trailingDiv");
let turnDiv = document.querySelector("#turnDiv");

const EMPTY_VALUE = pieces.length - 1;

const defaultSetup = {
    turn: "red",
    grid: `
    -b-b-b-b
    b-b-b-b-
    -b-b-b-b
    --------
    --------
    r-r-r-r-
    -r-r-r-r
    r-r-r-r-
    `
};

const localStorageBackend = (() => {
    const STATE = "state";
    const getState = () => {
        try {
            return JSON.parse(localStorage.getItem(STATE)) || defaultSetup;
        } catch (ex) {
            return defaultSetup;
        }
    };
    const set = (state) => localStorage.setItem(STATE, JSON.stringify(state));
    const remove = () => localStorage.removeItem(STATE);
    return { getState, set, remove };
})();


const store = (() => {
    const { getState, set, remove } = localStorageBackend;
    return {
        get state() {
            return getState()
        },
        set state({ grid, turn }) {
            set({ grid, turn })
        },
        reset: remove
    }
})()

class GridUpdate {
    constructor(row, column, value = EMPTY_VALUE) {
        this.indices = { row: row, column: column };
        this.value = value;
    }

    static updateFactory(final, finalVal, ...remove) {
        let updates = [];
        updates.push(new GridUpdate(final.finalRow, final.finalColumn, finalVal));
        remove.forEach(({ indices }) => updates.push(new GridUpdate(indices.row, indices.column)));
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
                let domCell = getDomCell(newTable, row, column);
                domCell.classList.add(`piece-${pieces[grid[row][column]]}`);
                if (cellVal < pieces.length - 1) {
                    domCell.classList.add('tograb');
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
                row.appendChild(cell);
            }
            table.appendChild(row);
        }
        table.id = "table";
        return table;
    }

    static computeGrid(grid, update) {
        let gridCopy = deepCopy2DArr(grid);
        update.forEach(({ indices: { row, column }, value }) => {
            gridCopy[row][column] = value;
        });
        return gridCopy;
    }

    static handleMove(finalRow, finalColumn, startRow, startColumn) {
        const startCell = state.grid[startRow][startColumn];
        const finalCell = state.grid[finalRow][finalColumn];
        if (finalCell !== EMPTY_VALUE || startCell === EMPTY_VALUE || colorForCell(startCell) !== state.currentTurn || (finalRow === -1 && finalColumn === -1))
            return state.updateUI();
        let flaggedCell = state.flaggedCell;
        if (flaggedCell !== undefined && ((startRow !== flaggedCell.row) || startColumn !== flaggedCell.column))
            return state.updateUI();

        let updates = [...generateGridUpdatesForMoveIfLegal(state.grid, finalRow, finalColumn, startRow, startColumn)];
        if (updates.length !== 0) { //was legal move...
            let updatedState = state.updateGrid(updates);
            let isTheMoveAnEatMove = (updates.length === 3 && pieces[updates[updates.length - 1].value].split("-")[1] !== "king") || (updates.length === 4),
                canTheMovingPieceStillEat = (allLegalEatingMovesForCell(updatedState.grid, finalRow, finalColumn).length !== 0);
            state = (isTheMoveAnEatMove && canTheMovingPieceStillEat) ? // was eat, and there are more eating options for the same cell
                updatedState.updateFlaggedCell({ row: finalRow, column: finalColumn }) :
                updatedState.updateFlaggedCell().updateCurrentTurn();
            if (didColorLose(state.grid, state.currentTurn)) {
                alert(`${state.currentTurn} lost! :(`);
                location.reload();
            }
        }
        state.updateUI();
        store.state = state.serialize();
    }

    static startSession({ grid, turn }) {
        const regularBoardSetup = changeGridStringToNumbers(grid).trim().split("\n").map(r => r.trim());
        const matrix = new Array(regularBoardSetup.length).fill(new Array(regularBoardSetup[0].length).fill(0)).map((row, rIndex) => row.map((cell, cIndex) => Number(regularBoardSetup[rIndex].charAt(cIndex))));
        return new BoardState(matrix, turn).updateUI()
    }

    serialize() {
        const classToAlias = ["b", "B", "r", "R", "-"];
        return {
            grid: this.grid.map((r) => {
                return r.map((c) => classToAlias[c]).join("")
            }).join("\n"),
            turn: this.currentTurn
        }
    }
}

let state = BoardState.startSession(store.state);
document.querySelector("#reset").addEventListener("click", () => {
    state = BoardState.startSession(defaultSetup);
    store.reset();
})


function mouseDownTable(event) {
    let { row: startRow, column: startColumn } = getIndicesForMouseCoordinates(event);

    const cellValue = state.grid[startRow][startColumn];
    if (cellValue === EMPTY_VALUE)
        return;

    let trailDiv = document.getElementById("trailingDiv");

    mainDiv.addEventListener("mousemove", pieceDrag);
    mainDiv.addEventListener("mouseup", function mouseup(event) {
        removeTrailingPiece(event);
        let { row: finalRow, column: finalColumn } = getIndicesForMouseCoordinates(event);
        BoardState.handleMove(finalRow, finalColumn, startRow, startColumn);
        mainDiv.removeEventListener("mouseup", mouseup);
    });

    let domCell = getDomCell(state.table, startRow, startColumn);
    trailDiv.className = domCell.className.split(" ").find(cls => cls.startsWith("piece"));
    ({ width, height } = trailDiv.getBoundingClientRect());
    function pieceDrag(event) {
        //-------------Temporarily remove dragging piece for The Purposes Of Drag------------------
        state.updateGrid([new GridUpdate(startRow, startColumn, EMPTY_VALUE)]).updateUI();
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

function generateGridUpdatesForMoveIfLegal(grid, finalRow, finalColumn, startRow, startColumn) {
    let startCell = grid[startRow][startColumn];

    const moves = allLogicalLegalMovesForCell(grid, startRow, startColumn, finalRow, finalColumn);

    const updates = moves.flatMap(({ updates }) => updates)

    if (((finalRow === grid.length - 1) || (finalRow === 0)) && updates.length > 0)
        updates.push(new GridUpdate(finalRow, finalColumn, pieces.indexOf(colorForCell(startCell) + "-" + "king")));

    return updates;
}

function allLogicalLegalMovesForCell(grid, startRow, startColumn, finalRow, finalColumn) {
    let notEatMoves = allLegalNonEatingMovesForCell(grid, startRow, startColumn);
    let eatMoves = allLegalEatingMovesForCell(grid, startRow, startColumn);

    const moves = [];

    if (isThereAnEatingPossibilityForGivenColor(grid, colorForCell(grid[startRow][startColumn]))) {
        for (let move of eatMoves) {
            const { finalCell } = move;
            if (finalCell.row === finalRow && finalCell.column === finalColumn)
                moves.push(move);
        }
    } else {
        for (let move of notEatMoves) {
            let finalCell = move.finalCell;
            if (finalCell.row === finalRow && finalCell.column === finalColumn) {
                moves.push(move);
            }
        }
    }

    return moves;
}

function isThereAnEatingPossibilityForGivenColor(grid, color) {
    return allCellsForColor(grid, color).some(({ row, column }) => allLegalEatingMovesForCell(grid, row, column).length > 0);
}


function colorForCell(gridVal) {
    return gridVal !== EMPTY_VALUE ? pieces[gridVal].split("-")[0] : "empty";
}


function allLegalEatingMovesForCell(grid, startRow, startColumn) {
    const possibleEatingDys = [2, -2];
    const eatingDxs = [2, -2];
    let possibleEatings = [];
    let startCell = grid[startRow][startColumn];

    if (startCell === EMPTY_VALUE)
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

            if (finalCell === EMPTY_VALUE)
                if (colorForCell(oneBefore) === BoardState.oppositeColor(colorForCell(startCell))) {
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


function allLegalNonEatingMovesForCell(grid, startRow, startColumn) {
    const possibleMovingDys = [1, -1];
    const movingDxs = [1, -1];

    let possibleMovings = [];
    let startCell = grid[startRow][startColumn];
    if (startCell === EMPTY_VALUE)
        return possibleMovings;
    const movingDys = pieces[startCell].includes("king") ? possibleMovingDys : [possibleMovingDys[colors.indexOf(colorForCell(grid[startRow][startColumn]))]];

    for (let dy of movingDys) {
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


function getIndicesForMouseCoordinates(event) {
    let tableParams = document.querySelector("#table").getBoundingClientRect();
    let subtractFromX = tableParams.left + window.pageXOffset;
    let subtractFromY = tableParams.top + window.pageYOffset;
    let x = event.clientX - subtractFromX, y = event.clientY - subtractFromY, width = tableParams.width,
        height = tableParams.height;

    if (x > width || y > height)
        return { row: -1, column: -1 };
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
                cells.push({ row: Number(row), column: Number(column) });
        }
    }
    return cells;
}

function didColorLose(grid, color) {
    return !allCellsForColor(grid, color).some(({ row, column }) => allLegalEatingMovesForCell(grid, row, column).length > 0 || allLegalNonEatingMovesForCell(grid, row, column).length > 0);
}



function getDomCell(table, row, column) {
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
    return ["b", "B", "r", "R", "-"].reduce((grid, alias, i) => grid.replaceAll(alias, i), gridstring)
}
