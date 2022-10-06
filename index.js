const pieces = ["black", "black-king", "red", "red-king", "empty"];
const colors = ["black", "red"];

const clsx = (...classes) => {
    const strings = classes.slice(-2);
    const bag = Object.entries(classes[classes.length - 1]).filter(([, v]) => Boolean(v)).map(([cls]) => cls);
    return [...strings, ...bag].join(" ");
}

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
`.trim().split("\n").filter(Boolean).join("\n")
};




class GridUpdate {
    constructor(row, column, value = EMPTY_VALUE) {
        this.indices = { row, column };
        this.value = value;
    }

    static updateFactory(final, finalVal, ...remove) {
        let updates = [];
        updates.push(new GridUpdate(final.finalRow, final.finalColumn, finalVal));
        remove.forEach(({ indices }) => updates.push(new GridUpdate(indices.row, indices.column)));
        return updates;
    }
}


const dom = (() => {
    const table = document.getElementById("table");
    const turnDiv = document.getElementById("turnDiv");
    const trailDiv = document.getElementById("trailingDiv");
    const mainDiv = document.getElementById("containerBoard");
    const reset = document.getElementById("reset");
    const share = document.getElementById("share");

    const getDomCell = (row, column) => table.rows[row].cells[column];

    const createIsPotentialMove = (potentialMoves) => {
        const moveSet = new Set(potentialMoves.map(({ row, column }) => `${row},${column}`));
        return (row, column) => moveSet.has(`${row},${column}`);
    }

    const forEachCell = (cb) => {
        for (let row = 0; row < 8; row++) {
            for (let column = 0; column < 8; column++) {
                cb({ row, column, domCell: getDomCell(row, column) });
            }
        }
    }

    const renderClasses = (grid, potentialMoves) => {
        const isPotentialMove = createIsPotentialMove(potentialMoves);
        forEachCell(({ row, column, domCell }) => {
            const cellVal = grid[row][column];
            const newValue = clsx(`piece-${pieces[cellVal]}`, {
                tograb: cellVal !== EMPTY_VALUE,
                "potential-move": isPotentialMove(row, column)
            });
            if (domCell.className !== newValue)
                domCell.className = newValue;
        })
    }

    function mouseDownTable(mouseDown) {
        let { row: startRow, column: startColumn } = getIndicesForMouseCoordinates(mouseDown);

        const cellValue = state.grid[startRow][startColumn];
        if (cellValue === EMPTY_VALUE)
            return;

        mainDiv.addEventListener("mousemove", pieceDrag);
        mainDiv.addEventListener("mouseup", function mouseup(mouseUp) {
            endDrag();
            let { row: finalRow, column: finalColumn } = getIndicesForMouseCoordinates(mouseUp);
            BoardState.handleMove(finalRow, finalColumn, startRow, startColumn);
            mainDiv.removeEventListener("mouseup", mouseup);
        });

        const domCell = getDomCell(startRow, startColumn);
        trailDiv.className = domCell.className.split(" ").find(cls => cls.startsWith("piece"));
        const { width, height } = trailDiv.getBoundingClientRect();
        const potentialMoves = state.getPotentialMoves(startRow, startColumn);
        //-------------Temporarily remove clicked on piece for The Purposes Of Drag------------------
        state.updatedGrid([new GridUpdate(startRow, startColumn, EMPTY_VALUE)]).updateUI(potentialMoves);
        trailDiv.style.top = mouseDown.clientY - height / 2 + "px";
        trailDiv.style.left = mouseDown.clientX - width / 2 + "px";
        function pieceDrag(mouseMove) {
            trailDiv.style.top = mouseMove.clientY - height / 2 + "px";
            trailDiv.style.left = mouseMove.clientX - width / 2 + "px";
        }

        function endDrag() {
            state.updateUI();
            mainDiv.removeEventListener("mousemove", pieceDrag);
            trailDiv.style.backgroundImage = "";
            trailDiv.style.top = "-1000px";
            trailDiv.style.left = "-1000px";
        }
    }

    const { left, top, width, height } = table.getBoundingClientRect();
    function getIndicesForMouseCoordinates(event) {
        let subtractFromX = left + window.pageXOffset;
        let subtractFromY = top + window.pageYOffset;
        let x = event.clientX - subtractFromX, y = event.clientY - subtractFromY;

        if (x > width || y > height)
            return { row: -1, column: -1 };
        let rows = state.grid.length;
        let columns = state.grid[0].length;
        return {
            row: Math.floor((y / height) * rows),
            column: Math.floor((x / width) * columns)
        };
    }

    function toast(text, ms = 2000) {
        const atoast = document.createElement('div');
        atoast.classList.add("toast")
        atoast.innerText = text;
        document.body.appendChild(atoast);
        setTimeout(() => {
            document.body.removeChild(atoast);
        }, ms);
    }

    table.addEventListener("mousedown", mouseDownTable);

    return {
        updateUI({ grid, turn, potentialMoves }) {
            turnDiv.style.backgroundColor = turn;
            renderClasses(grid, potentialMoves);
        },
        registerShare(cb) {
            share.addEventListener("click", cb)
        },
        registerReset(cb) {
            reset.addEventListener("click", cb)
        },
        registerHover(highlightHovered) {
            forEachCell(({ domCell, row, column }) => {
                domCell.addEventListener("mouseover", () => highlightHovered(row, column))
            })
        },
        toast
    };
})();

class BoardState {
    constructor(grid, turnColor, { flaggedCell } = {}) {
        this.grid = grid;
        this.currentTurn = turnColor;
        this.flaggedCell = flaggedCell;
    }

    updatedGrid(updates) {
        let newGrid = BoardState.computeGrid(this.grid, updates);
        return new BoardState(newGrid, this.currentTurn);
    }

    updateFlaggedCell(flagged = undefined) {
        return new BoardState(this.grid, this.currentTurn, { flagged });
    }

    updateCurrentTurn() {
        let grid = this.grid;
        return new BoardState(grid, BoardState.oppositeColor(this.currentTurn));
    }

    updateUI(potentialMoves = []) {
        dom.updateUI({ grid: this.grid, turn: this.currentTurn, potentialMoves });
        return this;
    }

    getPotentialMoves(startRow, startColumn) {
        return allLogicalLegalMovesForCell(this.grid, { startRow, startColumn }).map(({ finalCell }) => finalCell)
    }

    static oppositeColor(color) {
        return color === colors[0] ? colors[1] : colors[0];
    }

    static computeGrid(grid, update) {
        let gridCopy = deepCopy2DArr(grid);
        update.forEach(({ indices: { row, column }, value }) => {
            gridCopy[row][column] = value;
        });
        return gridCopy;
    }

    static handleMove(finalRow, finalColumn, startRow, startColumn) {
        const finalCell = state.grid[finalRow][finalColumn];
        if (finalCell !== EMPTY_VALUE || (finalRow === -1 && finalColumn === -1))
            return state.updateUI();

        let updates = generateGridUpdatesForMoveIfLegal(state.grid, { finalRow, finalColumn, startRow, startColumn });
        if (updates.length > 0) { //was legal move...
            let updatedState = state.updatedGrid(updates);
            let isTheMoveAnEatMove = (updates.length === 3 && pieces[updates[updates.length - 1].value].split("-")[1] !== "king") || (updates.length === 4),
                canTheMovingPieceStillEat = (allLegalEatingMovesForCell(updatedState.grid, finalRow, finalColumn).length !== 0);
            state = (isTheMoveAnEatMove && canTheMovingPieceStillEat) ? // was eat, and there are more eating options for the same cell
                updatedState.updateFlaggedCell({ row: finalRow, column: finalColumn }) :
                updatedState.updateFlaggedCell().updateCurrentTurn();
            if (didColorLose(state.grid, state.currentTurn)) {
                dom.toast(`${state.currentTurn} lost! :(`, 5000)
                resetGame();
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

function generateGridUpdatesForMoveIfLegal(grid, { finalRow, finalColumn, startRow, startColumn }) {
    const logicalMoves = allLogicalLegalMovesForCell(grid, { startRow, startColumn });
    const specificMove = logicalMoves.find((({ finalCell }) => finalCell.row === finalRow && finalCell.column === finalColumn))
    if (!specificMove) return [];

    const { updates } = specificMove;

    if (((finalRow === grid.length - 1) || (finalRow === 0)) && updates.length > 0)
        updates.push(new GridUpdate(finalRow, finalColumn, pieces.indexOf(colorForCell(grid[startRow][startColumn]) + "-" + "king")));

    return updates;
}

function allLogicalLegalMovesForCell(grid, { startRow, startColumn }) {
    const startCell = state.grid[startRow][startColumn];
    const { flaggedCell } = state;
    if (
        startCell === EMPTY_VALUE ||
        colorForCell(startCell) !== state.currentTurn ||
        (startRow === flaggedCell?.row && startColumn === flaggedCell?.column)
    )
        return [];
    return isThereAnEatingPossibilityForGivenColor(grid, colorForCell(grid[startRow][startColumn]))
        ? allLegalEatingMovesForCell(grid, startRow, startColumn)
        : allLegalNonEatingMovesForCell(grid, startRow, startColumn)
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





const storageBackend = (() => {
    const STATE = "state";
    const GRID = "grid";
    const TURN = "turn";
    const { pathname, href } = window.location;


    const fromLocalStorage = () => {
        try {
            return JSON.parse(localStorage.getItem(STATE));
        } catch (ex) {
            return;
        }
    };
    const fromParams = () => {
        const urlParams = new URLSearchParams(window.location.search);
        const grid = urlParams.get(GRID);
        const turn = urlParams.get(TURN);
        return grid ? { grid, turn } : undefined;
    }

    const fetch = () => (window.location.search ? fromParams() : fromLocalStorage()) || defaultSetup;

    const persist = ({ grid, turn } = defaultSetup) => {
        const params = new URLSearchParams();
        params.set(GRID, grid);
        params.set(TURN, turn);
        history.pushState(null, '', `${pathname}?${params.toString()}`);
        localStorage.setItem(STATE, JSON.stringify({ grid, turn }))
    };
    const reset = () => {
        history.pushState(null, '', pathname);
        localStorage.removeItem(STATE);
    };

    function compileSharingUrl() {
        const params = new URLSearchParams();
        const { grid, turn } = fetch();
        params.set(GRID, grid);
        params.set(TURN, turn);
        return `${href.split('?')[0]}?${params.toString()}`;
    }

    return { fetch, persist, reset, compileSharingUrl };
})();

const store = (() => {
    const { fetch, persist, reset, compileSharingUrl } = storageBackend;
    return {
        get state() {
            return fetch()
        },
        set state({ grid, turn }) {
            persist({ grid, turn })
        },
        reset,
        get share() {
            return compileSharingUrl();
        }
    }
})()




// MAIN:
dom.registerShare(() => {
    navigator.clipboard.writeText(store.share).then(() => {
        dom.toast("URL with game-state copied to clipboard! 🎆🎆🎆")
    })
})
dom.registerReset(() => {
    state = BoardState.startSession(defaultSetup);
    store.reset();
})
dom.registerHover((row, column) => state.updateUI(state.getPotentialMoves(row, column)))

let state = BoardState.startSession(store.state);
