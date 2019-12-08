const pieces = ["black_piece", "black_king", "red_piece", "red_king", "empty"];
container = document.querySelector("#containerBoard");
trailDiv = document.querySelector("#trailingDiv");


class Update {
    constructor(row, column, value) {
        this.indices = {row: row, column: column};
        this.value = value;
    }
}

class boardState {
    constructor(grid) {
        this.grid = grid;
        this.table = getTableForGrid(grid);
        this.table.addEventListener("mousedown", (event) => mouseDown(event));
    }

    updateGrid(updates) {
        let newGrid = computeGrid(this.grid, updates);
        return new boardState(newGrid);
    }

    updateUI() {
        let currentUITable = container.querySelector("table");
        if (currentUITable !== null) currentUITable.remove();
        container.appendChild(this.table);
        return this;
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

let state = new boardState(grid);
state.updateUI();


let oldGrid;

function mouseDown(event) {
    oldGrid = state.grid;
    let {row: downRow, column: downColumn} = getIndicesForMouseCoordinates(event);
    let cell = getCellRef(state.table, downRow, downColumn);
    if (cell.style.backgroundImage === "")
        return;


    window.addEventListener("mousemove", trailMouseWithPiece);
    window.addEventListener("mouseup", function mouseup(event) {
        removeTrailingPiece(event);
        updates = [new Update(downRow, downColumn, pieces[emptyPicIndex()]), ...checkMove(event, {
            cell,
            downRow,
            downColumn
        })];
        state = (updates.length !== 1) ? state.updateGrid(updates).updateUI() : state.updateUI();
        window.removeEventListener("mouseup", mouseup);
    });


    function trailMouseWithPiece(event) {
        update = new Update(downRow, downColumn, pieces[emptyPicIndex()]);
        state.updateGrid([update]).updateUI();
        ({width, height} = trailDiv.getBoundingClientRect());
        trailDiv.style.backgroundImage = cell.style.backgroundImage;
        trailDiv.style.top = event.clientY - height / 2 + "px";
        trailDiv.style.left = event.clientX - width / 2 + "px";
    }

    function removeTrailingPiece(event) {
        window.removeEventListener("mousemove", trailMouseWithPiece);
        trailDiv.style.backgroundImage = "";
        trailDiv.style.top = "-1000px";
        trailDiv.style.left = "-1000px";
    }
}


function checkMove(mouseUpEvent, {cell, downRow, downColumn}) {
    let updates = [];
    let {row: upRow, column: upColumn} = getIndicesForMouseCoordinates(mouseUpEvent);
    if (upRow === -1 && upColumn === -1)
        return updates;
    if (Math.abs(upRow - downRow) !== Math.abs(upColumn - downColumn))
        return updates;

    updates.push(new Update(upRow, upColumn, oldGrid[downRow][downColumn]));
    return updates;
}


function getIndicesForMouseCoordinates(event) {
    let tableParams = document.querySelector("#table").getBoundingClientRect();
    let x = event.clientX, y = event.clientY, height = tableParams.height, width = tableParams.width;
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
            return (pieces[currentValue].split("_")[0] === color) ? ++accumulator : accumulator;
        }, count);
    }
    return count;
}

function divideMeasure(measure, divider) {
    var number = Number(measure.replace(/\D*/g, ""));
    var measurement = measure.replace(/\d*/, "");
    return number / divider + measurement;
}

function getTableForGrid(grid) {
    let newTable = createTable(grid.length, grid[0].length);
    rowsIndices = Object.keys(grid);
    for (let row = 0; row < grid.length; row++) {
        for (let column = 0; column < grid[0].length; column++) {
            cellVal = grid[row][column];
            actualBoardCell = getCellRef(newTable, row, column);
            if (cellVal < pieces.length - 1) {
                actualBoardCell.className += " grab";
                actualBoardCell.style.backgroundImage = `url('pictures/${pieces[grid[row][column]]}.png')`;
            }
        }
    }
    return newTable;
}

function emptyPicIndex() {
    return pieces.length - 1;
}


function computeGrid(grid, update) {
    gridCopy = deepCopy2DArr(grid);
    update.forEach(({indices: {row, column}, value}) => {
        gridCopy[row][column] = value;
    });
    return gridCopy;
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