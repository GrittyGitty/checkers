type EventMap = HTMLElementEventMap;
type ValueOf<T> = T[keyof T];
type KeysForValue<T, V extends ValueOf<T>> = {
  [K in keyof T]: T[K] extends V ? K : never;
}[keyof T];
export type EventMapSubset<V extends ValueOf<EventMap>> = KeysForValue<EventMap, V>;

export enum Color {
  "black" = "black",
  "red" = "red"
}

export type Cell = {
  row: number;
  column: number;
}

export type FinalCell = {
  finalRow: number;
  finalColumn: number;
}

export type StartCell = {
  startRow: number;
  startColumn: number;
}


export type Grid = number[][];

export type EventCoords = {
  clientX: number;
  clientY: number;
};

export type SerializedState = { grid: string; turn: Color };

export type StateControllers = { handleMove: (a: number, b: number, c: number, d: number,) => void; updateUI: (startRow: number, startColumn: number) => void };