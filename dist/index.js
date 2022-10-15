const pieces = ["black", "black-king", "red", "red-king", "empty"];
const movingDys = [[-1], [-1, 1], [1], [-1, 1]];
const eatingDys = movingDys.map((dirs) => dirs.map((d) => d * 2));
const colors = ["black", "red"];
const EMPTY_VALUE = pieces.length - 1;

const clsx = (...classes) => {
    const bag = Object.entries(classes.pop()).filter(([, v]) => Boolean(v)).map(([cls]) => cls);
    return [...classes, ...bag].join(" ");
}


const defaultSetup = {
    turn: "black",
    grid: `
-r-r-r-r
r-r-r-r-
-r-r-r-r
--------
--------
b-b-b-b-
-b-b-b-b
b-b-b-b-
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

function forEach(cb) {
    for (let row = 0; row < 8; row++) {
        for (let column = 0; column < 8; column++) {
            cb(row, column);
        }
    }
}

const trailingTranslate = (x, y) => `translateX(${x}px) translateY(${y}px)`;


const dom = (() => {
    const $ = (id) => document.getElementById(id);

    const table = $("table");
    const turnDiv = $("turnDiv");
    const trailDiv = $("trailingDiv");
    const mainDiv = $("containerBoard");
    const reset = $("reset");
    const share = $("share");
    const undo = $("undo");
    const redo = $("redo");

    const [click, mousedown, mouseover, keydown, touchstart] =
        ["click", "mousedown", "mouseover", "keydown", "touchstart"].map(
            e => (el, cb) => el.addEventListener(e, cb)
        );

    const LEGAL_TARGET = "legal-target";
    const CAN_MOVE = "can-move";
    const pieceClasses = pieces.map((_, i) => `piece-${pieces[i]}`);
    const EMPTY_PIECE = pieceClasses[EMPTY_VALUE];
    const colorToClass = Object.fromEntries(colors.map((c) => [c, `piece-${c}`]));
    const getDomCell = (row, column) => table.rows[row].cells[column];

    const createCellInListChecker = (list) => {
        const moveSet = new Set(list.map(({ row, column }) => `${row},${column}`));
        return (row, column) => moveSet.has(`${row},${column}`);
    }

    let dragging = false;

    const forEachCell = (cb) => forEach((row, column) => cb({ row, column, domCell: getDomCell(row, column) }))

    const renderClasses = (grid, { legalTargets, piecesThatCanMove, turn }) => {
        turnDiv.className = colorToClass[turn];
        undo.disabled = idx === 0;
        redo.disabled = idx === stack.length - 1;
        const isLegalTargetForHoveredCell = createCellInListChecker(legalTargets);
        const canMove = createCellInListChecker(piecesThatCanMove)
        forEachCell(({ row, column, domCell }) => {
            const cellVal = grid[row][column];
            const newValue = clsx(pieceClasses[cellVal], {
                [LEGAL_TARGET]: isLegalTargetForHoveredCell(row, column),
                [CAN_MOVE]: canMove(row, column) && !dragging
            });
            if (domCell.className !== newValue)
                domCell.className = newValue;
        })
    }

    mousedown(table, (e) => {
        startDrag(e, { moveEvent: "mousemove", endEvent: "mouseup", coordsExtractor: e => e })
    })
    touchstart(table, (e) => {
        startDrag(e, { moveEvent: "touchmove", endEvent: "touchend", coordsExtractor: e => e.changedTouches[0] });
    })

    function startDrag(e, { moveEvent, endEvent, coordsExtractor }) {
        const { clientX, clientY } = coordsExtractor(e);
        console.log({ clientX, clientY });
        let { row: startRow, column: startColumn } = getIndicesForMouseCoordinates({ clientX, clientY });

        const classSet = new Set(getDomCell(startRow, startColumn).classList);
        const cellHas = classSet.has.bind(classSet);
        if (!cellHas(CAN_MOVE) || cellHas(EMPTY_PIECE))
            return;

        dragging = true;

        mainDiv.addEventListener(moveEvent, drag);
        mainDiv.addEventListener(endEvent, endDrag, { once: true });


        trailDiv.className = pieceClasses.find(cellHas);
        const { width, height } = trailDiv.getBoundingClientRect();
        const legalTargets = state.getLegalTargets(startRow, startColumn);
        //-------------Temporarily remove clicked on piece for The Purposes Of Drag------------------
        state.updatedGrid([new GridUpdate(startRow, startColumn, EMPTY_VALUE)]).updateUI(legalTargets);
        console.log(e);
        trailDiv.style.transform = trailingTranslate(clientX - width / 2, clientY - height / 2);
        function drag(move) {
            const { clientX, clientY } = coordsExtractor(move);
            trailDiv.style.transform = trailingTranslate(clientX - width / 2, clientY - height / 2);
        }

        function endDrag(end) {
            mainDiv.removeEventListener(moveEvent, drag);
            trailDiv.style.backgroundImage = "";
            trailDiv.style.transform = trailingTranslate(-1000, -1000);
            dragging = false;
            let { row: finalRow, column: finalColumn } = getIndicesForMouseCoordinates(coordsExtractor(end));
            BoardState.handleMove(finalRow, finalColumn, startRow, startColumn);
        }
    }

    let { left, top, width, height } = table.getBoundingClientRect();
    function getIndicesForMouseCoordinates({ clientX, clientY }) {
        const subtractFromX = left + window.pageXOffset;
        const subtractFromY = top + window.pageYOffset;
        const x = clientX - subtractFromX, y = clientY - subtractFromY;

        if (x > width || y > height)
            return { row: -1, column: -1 };
        return {
            row: Math.floor((y / height) * 8),
            column: Math.floor((x / width) * 8)
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

    window.onresize = () => ({ left, top, width, height } = table.getBoundingClientRect());
    return {
        updateUI({ grid, turn, legalTargets, piecesThatCanMove }) {
            renderClasses(grid, { legalTargets, piecesThatCanMove, turn });
        },
        registerShare: cb => click(share, cb),
        registerUndo: (undoCb, redoCb) => {
            click(undo, undoCb);
            click(redo, redoCb);
            keydown(window, ({ key }) => {
                if (key === "ArrowLeft" && !undo.disabled) undoCb();
                if (key === "ArrowRight" && !redo.disabled) redoCb();
            });
        },
        registerReset: cb => click(reset, cb),
        registerHover(highlightHovered) {
            forEachCell(({ domCell, row, column }) => {
                mouseover(domCell, () => highlightHovered(row, column))
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
        this.piecesThatCanMove = this.getPiecesThatCanMove();
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

    getPiecesThatCanMove() {
        return allCellsForColor(this.grid, this.currentTurn).filter(({ row, column }) => this.getLegalTargets(row, column).length);
    }

    updateUI(legalTargets = []) {
        dom.updateUI({ grid: this.grid, turn: this.currentTurn, legalTargets, piecesThatCanMove: this.piecesThatCanMove });
        return this;
    }

    getLegalTargets(startRow, startColumn) {
        return allLogicalLegalMovesForCell(this, { startRow, startColumn }).map(({ finalCell }) => finalCell)
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

        let updates = generateGridUpdatesForMoveIfLegal(state, { finalRow, finalColumn, startRow, startColumn });
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
        const serialized = state.serialize();
        store.state = serialized;
        stack[++idx] = serialized;
        stack.splice(idx + 1);
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

function generateGridUpdatesForMoveIfLegal(state, { finalRow, finalColumn, startRow, startColumn }) {
    const logicalMoves = allLogicalLegalMovesForCell(state, { startRow, startColumn });
    const specificMove = logicalMoves.find((({ finalCell }) => finalCell.row === finalRow && finalCell.column === finalColumn))
    if (!specificMove) return [];

    const { updates } = specificMove;

    if (((finalRow === 7) || (finalRow === 0)) && updates.length > 0)
        updates.push(new GridUpdate(finalRow, finalColumn, pieces.indexOf(colorForCell(state.grid[startRow][startColumn]) + "-" + "king")));

    return updates;
}

function allLogicalLegalMovesForCell({ grid, flaggedCell, currentTurn }, { startRow, startColumn }) {
    const startCell = grid[startRow][startColumn];
    if (
        startCell === EMPTY_VALUE ||
        colorForCell(startCell) !== currentTurn ||
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
    const eatingDxs = [2, -2];
    let possibleEatings = [];
    let startCell = grid[startRow][startColumn];

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
    const movingDxs = [1, -1];

    let possibleMovings = [];
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

function allCellsForColor(grid, color) {
    const cells = [];
    forEach((row, column) => {
        if (colorForCell(grid[row][column]) === color)
            cells.push({ row, column })
    })
    return cells;
}

function didColorLose(grid, color) {
    return !allCellsForColor(grid, color).some(({ row, column }) => allLegalEatingMovesForCell(grid, row, column).length > 0 || allLegalNonEatingMovesForCell(grid, row, column).length > 0);
}

const deepCopy2DArr = (arr) => arr.map((r) => r.map((c) => c));


function areRowsOutOfBounds(...indices) {
    return indices.some(row => row >= 8 || row < 0);
}

function areColumnsOutOfBounds(...indices) {
    return indices.some(column => column >= 8 || column < 0);
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



function resetGame() {
    state = BoardState.startSession(defaultSetup);
    stack = [defaultSetup];
    idx = 0;
    store.reset();
}
// MAIN:
dom.registerShare(() => {
    navigator.clipboard.writeText(store.share).then(() => {
        dom.toast("URL with game-state copied to clipboard! 🎆🎆🎆")
    })
})
dom.registerReset(resetGame);
dom.registerHover((row, column) => state.updateUI(state.getLegalTargets(row, column)))

dom.registerUndo(
    () => {
        state = BoardState.startSession(stack[--idx]);
        store.state = state.serialize();
    },
    () => {
        state = BoardState.startSession(stack[++idx]);
        store.state = state.serialize();
    }
);
let stack = [store.state];
let idx = 0;
let state = BoardState.startSession(store.state);
