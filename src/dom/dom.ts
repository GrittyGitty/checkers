import { type BoardState } from "../classes/BoardState";
import { pieces, EMPTY_VALUE, colors } from "../consts";
import { stack } from "../stack";
import {
  type Cell,
  type EventMapSubset,
  type EventCoords,
  type StateControllers,
} from "../types";
import { forEachCell } from "../utils";

export const values = {
  ai: true,
  depth: 7,
  toggleAi() {
    return (this.ai = !this.ai);
  },
};

const $ = <E extends HTMLElement = HTMLElement>(id: string) => {
  const element = document.getElementById(id);
  if (element == null) {
    throw new Error(`${id} element does not exist`);
  }
  return element as E;
};

const table = $<HTMLTableElement>("table");
const turnDiv = $("turnDiv");
const trailDiv = $("trailingDiv");
const mainDiv = $("containerBoard");
const reset = $("reset");
const share = $("share");
const undo = $<HTMLButtonElement>("undo");
const redo = $<HTMLButtonElement>("redo");
const ai = $<HTMLInputElement>("ai");
const depth = $<HTMLInputElement>("depth");
ai.checked = values.ai;
depth.value = String(values.depth);

const add =
  <K extends keyof HTMLElementEventMap>(e: K) =>
  (el: HTMLElement, cb: (e: HTMLElementEventMap[K]) => void) => {
    el.addEventListener(e, cb);
  };
const click = add("click");
const mousedown = add("mousedown");
const mouseover = add("mouseover");
const touchstart = add("touchstart");
const change = add("change");

change(depth, (e) => {
  const { valueAsNumber } = e.target as HTMLInputElement;
  values.depth = valueAsNumber;
});

const LEGAL_TARGET = "legal-target";
const CAN_MOVE = "can-move";
export const MOVE_SOURCE = "move-source";
export const MOVE_DESTINATION = "move-destination";
const pieceClasses = pieces.map((_, i) => `piece-${pieces[i]}`);
const EMPTY_PIECE = pieceClasses[EMPTY_VALUE];
const colorToClass = Object.fromEntries(colors.map((c) => [c, `piece-${c}`]));
const getDomCell = (row: number, column: number) =>
  table.rows[row].cells[column];

const createCellInListChecker = (list: Cell[]) => {
  const moveSet = new Set(list.map(({ row, column }) => `${row},${column}`));
  return (row: number, column: number) => moveSet.has(`${row},${column}`);
};

let dragging = false;

const forEachDomCell = (
  doThis: (row: number, column: number, domCell: HTMLTableCellElement) => void
) => {
  forEachCell((row: number, column: number) => {
    doThis(row, column, getDomCell(row, column));
  });
};

const renderClasses = (
  { grid, turn, lastMove, piecesThatCanMove }: BoardState,
  legalTargets: Cell[]
) => {
  turnDiv.className = colorToClass[turn];
  undo.disabled = stack.isEmpty;
  redo.disabled = stack.isEnd;
  const isLegalTargetForHoveredCell = createCellInListChecker(legalTargets);
  const canMove = createCellInListChecker(piecesThatCanMove);
  forEachDomCell((row, column, domCell) => {
    const cellVal = grid[row][column];
    const piece = pieceClasses[cellVal];
    let newValue = `${piece} `;
    if (lastMove) {
      const { startRow, startColumn, finalRow, finalColumn } = lastMove;
      if (startRow === row && startColumn === column)
        newValue += `${MOVE_SOURCE} `;
      else if (finalRow === row && finalColumn === column)
        newValue += `${MOVE_DESTINATION} `;
    }
    if (isLegalTargetForHoveredCell(row, column)) {
      newValue += `${LEGAL_TARGET} `;
    }
    if (!dragging && canMove(row, column)) {
      newValue += CAN_MOVE;
    }

    if (domCell.className !== newValue) {
      domCell.className = newValue;
    }
  });
};

const createDrag = (stateControllers: StateControllers) => {
  mousedown(table, (e) => {
    startDrag(e, {
      moveEvent: "mousemove",
      endEvent: "mouseup",
      coordsExtractor: (e) => e,
    });
  });
  touchstart(table, (e) => {
    startDrag(e, {
      moveEvent: "touchmove",
      endEvent: "touchend",
      coordsExtractor: (e) => e.changedTouches[0],
    });
  });
  function startDrag<EventKey extends EventMapSubset<TouchEvent | MouseEvent>>(
    e: HTMLElementEventMap[EventKey],
    {
      moveEvent,
      endEvent,
      coordsExtractor,
    }: {
      moveEvent: EventKey;
      endEvent: EventKey;
      coordsExtractor: (ev: typeof e) => EventCoords;
    }
  ) {
    const { clientX, clientY } = coordsExtractor(e);
    const { row: startRow, column: startColumn } =
      getIndicesForMouseCoordinates({ clientX, clientY });

    const classSet = new Set(
      Array.from(getDomCell(startRow, startColumn).classList)
    );
    const cellHas = classSet.has.bind(classSet);
    if (!cellHas(CAN_MOVE) || cellHas(EMPTY_PIECE)) {
      return;
    }

    dragging = true;

    mainDiv.addEventListener(moveEvent, drag);
    mainDiv.addEventListener(endEvent, endDrag, { once: true });

    const color = pieceClasses.find(cellHas);
    if (typeof color === "string") {
      trailDiv.className = color;
    }
    const { width, height } = trailDiv.getBoundingClientRect();

    // -------------Temporarily remove clicked on piece for The Purposes Of Drag------------------
    stateControllers.updateUI(startRow, startColumn);

    const translateTrailingDiv = (x: number, y: number) => {
      trailDiv.style.transform =
        `translateX(${x}px) translateY(${y}px)` as const;
    };

    const { x, y } = pointRelativeToTable({ clientX, clientY });

    const pieceRelativeX = x % width;
    const pieceRelativeY = y % height;

    const translateTrailingDivOffsetByRelativePoint = ({
      clientX,
      clientY,
    }: EventCoords) => {
      translateTrailingDiv(clientX - pieceRelativeX, clientY - pieceRelativeY);
    };
    translateTrailingDivOffsetByRelativePoint({ clientX, clientY });

    function drag(move: typeof e) {
      const { clientX, clientY } = coordsExtractor(move);
      translateTrailingDivOffsetByRelativePoint({ clientX, clientY });
    }

    function endDrag(end: typeof e) {
      mainDiv.removeEventListener(moveEvent, drag);
      trailDiv.style.backgroundImage = "";
      translateTrailingDiv(-1000, -1000);
      dragging = false;
      const { row: finalRow, column: finalColumn } =
        getIndicesForMouseCoordinates(coordsExtractor(end));
      stateControllers.handleMove(finalRow, finalColumn, startRow, startColumn);
    }
  }
};

let { left, top, width, height } = table.getBoundingClientRect();
window.onresize = () =>
  ({ left, top, width, height } = table.getBoundingClientRect());

function pointRelativeToTable({ clientX, clientY }: EventCoords) {
  const subtractFromX = left + window.pageXOffset;
  const subtractFromY = top + window.pageYOffset;
  const x = clientX - subtractFromX;
  const y = clientY - subtractFromY;
  return { x, y };
}

function getIndicesForMouseCoordinates({ clientX, clientY }: EventCoords) {
  const { x, y } = pointRelativeToTable({ clientX, clientY });
  if (x > width || y > height) {
    return { row: -1, column: -1 };
  }
  return {
    row: Math.floor((y / height) * 8),
    column: Math.floor((x / width) * 8),
  };
}

export const dom = {
  updateDOM({
    state,
    legalTargets,
  }: {
    state: BoardState;
    legalTargets: Cell[];
  }) {
    renderClasses(state, legalTargets);
  },
  registerShare: (cb: (e: MouseEvent) => void) => {
    click(share, cb);
  },
  registerUndo: (undoCb: VoidFunction, redoCb: VoidFunction) => {
    click(undo, undoCb);
    click(redo, redoCb);
    window.addEventListener("keydown", ({ key }) => {
      if (key === "ArrowLeft" && !undo.disabled) undoCb();
      if (key === "ArrowRight" && !redo.disabled) redoCb();
    });
  },
  registerReset: (cb: VoidFunction) => {
    click(reset, cb);
  },
  registerHover(highlightHovered: (row: number, column: number) => void) {
    forEachDomCell((row, column, domCell) => {
      mouseover(domCell, () => {
        if (!dragging) highlightHovered(row, column);
      });
    });
  },
  registerDrag(controllers: StateControllers) {
    createDrag(controllers);
  },
  registerAi(onToggle: (ai: boolean) => void) {
    click(ai, () => {
      onToggle(values.toggleAi());
    });
  },
};
