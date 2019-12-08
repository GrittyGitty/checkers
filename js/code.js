const pieces = ["black_piece", "black_king", "red_piece", "red_king", "empty"];
const colors = Array.from(new Set(pieces.slice(0, pieces.length - 1).map(value => value.split("_")[0])));

container = document.querySelector("#containerBoard");
trailDiv = document.querySelector("#trailingDiv");
turnDiv = document.querySelector("#turnDiv");


class GridUpdate {
    constructor(row, column, value) {
        this.indices = {row: row, column: column};
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
        update.forEach(({indices: {row, column}, value}) => {
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
42424242
24242424
`.trim().split("\n");
let grid = new Array(gridString.length).fill(new Array(gridString[0].length).fill(0)).map((row, rIndex) =>
    row.map((cell, cIndex) => Number(gridString[rIndex].charAt(cIndex)))
);

let state = new BoardState(grid, colors[1]);
state.updateUI();


function mouseDown(event) {
    let {row: downRow, column: downColumn} = getIndicesForMouseCoordinates(event);
    let gridCellValue = state.grid[downRow][downColumn];//(state.table, downRow, downColumn);

    if (gridCellValue === emptyPicIndex())
        return;

    let trailDiv = document.getElementById("trailingDiv");

    container.addEventListener("mousemove", pieceDrag);
    container.addEventListener("mouseup", function mouseup(event) {
        removeTrailingPiece(event);
        let updates = [new GridUpdate(downRow, downColumn, pieces[emptyPicIndex()]), ...checkMove(event, {
            gridCellValue,
            downRow,
            downColumn
        })];
        state = (updates.length !== 1) ? state.updateGrid(updates).updateCurrentTurn().updateUI() : state.updateUI();
        container.removeEventListener("mouseup", mouseup);
    });


    function pieceDrag(event) {
        state.updateGrid([new GridUpdate(downRow, downColumn, pieces[emptyPicIndex()])]).updateUI();
        ({width, height} = trailDiv.getBoundingClientRect());
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


function checkMove(mouseUpEvent, {gridCellValue, downRow, downColumn}) {
    let updates = [];
    let {row: upRow, column: upColumn} = getIndicesForMouseCoordinates(mouseUpEvent);
    if (upRow === -1 && upColumn === -1)
        return updates;
    if (state.currentTurn !== colorForVal(gridCellValue)){
        alert("Not your turn!");
        return updates;
    }
    if (Math.abs(upRow - downRow) !== Math.abs(upColumn - downColumn)) {
        alert("illegal move!");
        return updates;
    }
    updates.push(new GridUpdate(upRow, upColumn, state.grid[downRow][downColumn]));
    return updates;
}

function colorForVal(gridVal) {
    return pieces[gridVal].split("_")[0];
}

function getIndicesForMouseCoordinates(event) {
    let tableParams = document.querySelector("#table").getBoundingClientRect();
    subtractFromX = tableParams.left + window.pageXOffset;
    subtractFromY = tableParams.top + window.pageYOffset;

    let x = event.clientX - subtractFromX, y = event.clientY - subtractFromY, height = tableParams.height,
        width = tableParams.width;
    if (x > width || y > height)
        return {row: -1, column: -1};
    let rows = state.grid.length;
    let columns = state.grid[0].length;
    return {
        row: Math.floor((y / height) * rows),
        column: Math.floor((x / width) * columns)
    };
}

function countColor(grid, color) {
    let count = 0;
    for (let row of grid) {
        count += row.reduce((accumulator, currentValue) => {
            return (pieces[currentValue].split("_")[0] === color) ? accumulator + 1 : accumulator;
        }, count);
    }
    return count;
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