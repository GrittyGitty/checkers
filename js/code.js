const pieces = ["black_piece", "black_king", "red_piece", "red_king", "empty"];
const colors = Array.from(new Set(pieces.slice(0, pieces.length - 1).map(value => value.split("_")[0])));

container = document.querySelector("#containerBoard");
trailDiv = document.querySelector("#trailingDiv");
turnDiv = document.querySelector("#turnDiv");


class GridUpdate {
    constructor(row, column, value) {
        this.indices = { row: row, column: column };
        this.value = value;
    }
}


class BoardState {
    constructor(grid, turnColor) {
        this.grid = grid;
        this.currentTurn = turnColor;
        this.table = BoardState.getTableForGrid(grid);
        this.table.addEventListener("mousedown", (event) => mouseDown(event));
    }

    updateGrid(updates) {
        let newGrid = BoardState.computeGrid(this.grid, updates);
        return new BoardState(newGrid, this.currentTurn);
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
        let newTable = createTable(grid.length, grid[0].length);
        let rowsIndices = Object.keys(grid);
        for (let row = 0; row < grid.length; row++) {
            for (let column = 0; column < grid[0].length; column++) {
                let cellVal = grid[row][column];
                let actualBoardCell = getCellRef(newTable, row, column);
                if (cellVal < pieces.length - 1) {
                    actualBoardCell.className += " grab";
                    actualBoardCell.style.backgroundImage = `url('pictures/${pieces[grid[row][column]]}.png')`;
                }
            }
        }
        return newTable;
    }

    static computeGrid(grid, update) {
        let gridCopy = deepCopy2DArr(grid);
        update.forEach(({ indices: { row, column }, value }) => {
            gridCopy[row][column] = value;
        });
        return gridCopy;
    }
}


let gridString = `
40404040
04040404
40404040
44444444
44444444
24242424
43424242
24442424
`/*let gridString = `
044
024
024
`*/
    .trim().split("\n");
let grid = new Array(gridString.length).fill(new Array(gridString[0].length).fill(0)).map((row, rIndex) =>
    row.map((cell, cIndex) => Number(gridString[rIndex].charAt(cIndex)))
);

let state = new BoardState(grid, colors[1]);
state.updateUI();


function mouseDown(event) {
    let { row: downRow, column: downColumn } = getIndicesForMouseCoordinates(event);
    let gridCellValue = state.grid[downRow][downColumn];
    if (gridCellValue === emptyPicIndex())
        return;

    let trailDiv = document.getElementById("trailingDiv");

    container.addEventListener("mousemove", pieceDrag);
    container.addEventListener("mouseup", function mouseup(event) {
        removeTrailingPiece(event);
        let updates = [...checkMove(state.grid, getIndicesForMouseCoordinates(event), {
            downRow,
            downColumn
        })];
        state = (updates.length !== 0) ? state.updateGrid(updates).updateCurrentTurn().updateUI() : state.updateUI();
        container.removeEventListener("mouseup", mouseup);
    });


    function pieceDrag(event) {
        state.updateGrid([new GridUpdate(downRow, downColumn, emptyPicIndex())]).updateUI();
        ({ width, height } = trailDiv.getBoundingClientRect());
        let cell = getCellRef(state.table, downRow, downColumn);
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

function checkMove(grid, upCoords, { downRow, downColumn }) {
    let { row: upRow, column: upColumn } = upCoords;
    let updates = [];
    let startCell = grid[downRow][downColumn];
    let isKing = pieces[startCell].includes("king");
    let direction = cellColor(startCell) === colors[0] ? 1 : -1;

    let finalCell = grid[upRow][upColumn];

    if (upRow === -1 && upColumn === -1)
        return updates;

    if (state.currentTurn !== cellColor(startCell)) {
        alert("Not your turn!");
        return updates;
    }

    if (finalCell !== emptyPicIndex()) {
        alert("cannot override piece!");
        return updates;
    }

    if ((Math.sign(upRow - downRow) !== direction) && !isKing) {
        alert("only kings can move backwards!");
        return updates;
    }

    let xSteps = Math.abs(upRow - downRow), ySteps = Math.abs(upColumn - downColumn);
    if (xSteps !== ySteps) {
        alert("only diagonal moves!");
        return updat1es;
    }

    /*if (xSteps === 1) {
        if (check)
            }*/

    if ((upRow === grid.length - 1) || upRow === 0)
        updates.push(new GridUpdate(upRow, upColumn, pieces.indexOf(cellColor(startCell) + "_" + "king")));

    /*updates.push(new GridUpdate(upRow, upColumn, state.grid[downRow][downColumn])); */
    return updates;
}

function cellColor(gridVal) {
    return pieces[gridVal].split("_")[0];
}



king = {}

const possibleValidDys = [2, -2];
const validDxs = [2, -2];

function allEatingPossibilitiesForCell(grid, startRow, startColumn) {
    let possibleEatings = [];
    let startCell = grid[startRow][startColumn];
    let validDys = pieces[startCell].includes("king") ? possibleValidDys.slice(0) : [possibleValidDys[colors.indexOf(cellColor(grid[startRow][startColumn]))]];
    for (let dy of validDys) {
        for (let dx of validDxs) {
            let finalRow = startRow + dy, finalColumn = startColumn + dx;
            if (rowOutOfBounds(finalRow) || columnOutOfBounds(finalColumn))
                continue;
            let finalCell = grid[finalRow][finalColumn];

            let oneBeforeRow = startRow + ((Math.abs(dy) - 1) * Math.sign(dy)),
                oneBeforeColumn = startColumn + ((Math.abs(dx) - 1) * Math.sign(dx));

            let oneBefore = grid[oneBeforeRow][oneBeforeColumn];

            if (finalCell === emptyPicIndex())
                if (cellColor(oneBefore) === BoardState.oppositeColor(cellColor(startCell))) {
                    let firstUpdate = new GridUpdate(startRow, startColumn, emptyPicIndex()),
                        secondUpdate = new GridUpdate(oneBeforeRow, oneBeforeColumn, emptyPicIndex()),
                        thirdUpdate = new GridUpdate(finalRow, finalColumn, startCell);
                    possibleEatings.push({ finalCell: { row: finalRow, column: finalColumn }, updates: [firstUpdate, secondUpdate, thirdUpdate] });
                }
        }
    }
    return possibleEatings;
}

function allMovingPossibilitiesForCell(){

}




function getIndicesForMouseCoordinates(event) {
    let tableParams = document.querySelector("#table").getBoundingClientRect();
    subtractFromX = tableParams.left + window.pageXOffset;
    subtractFromY = tableParams.top + window.pageYOffset;

    let x = event.clientX - subtractFromX, y = event.clientY - subtractFromY, height = tableParams.height,
        width = tableParams.width;
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
            if (cellColor(grid[row][column]) === color)
                cells.push({ row: Number(row), column: Number(column) });
        }
    }
    return cells;
}

function isColorLoss(grid, color) {
    return allCellsForColor(grid, color).some(({ row, column }) => allEatingPossibilitiesForCell(grid, row, column).length > 0);
}

function divideMeasure(measure, divider) {
    var number = Number(measure.replace(/\D*/g, ""));
    var measurement = measure.replace(/\d*/, "");
    return number / divider + measurement;
}


function emptyPicIndex() {
    return pieces.length - 1;
}


//not immutable!
function getCellRef(table, row, column) {
    return table.rows[row].cells[column];
}


function deepCopy2DArr(arr) {
    return arr.map(
        (row, rIndex) => row.map((column, cIndex) => column));
}

function createTable(rows, columns) {
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

function indexOfImageAtURL(url) {
    return pieces[pieces.indexOf(url.match(/"pictures[/](.*)"/)[1])];

}

function rowOutOfBounds(...indices) {
    return indices.some(row => row > state.grid.length - 1 || row < 0);
}

function columnOutOfBounds(...indices) {
    return indices.some(column => column > state.grid[0].length || column < 0);
}