import { defaultSetup } from "./store/storageBackend";
import { store } from "./store/store";
import { type SerializedState } from "./types";

let _stack = [store.serialized];
let idx = 0;

export const stack = {
  resetStack: () => {
    _stack = [defaultSetup];
    idx = 0;
  },
  add: (serialized: SerializedState) => {
    _stack[++idx] = serialized;
    _stack.splice(idx + 1);
  },
  dec: () => _stack[--idx],
  inc: () => _stack[++idx],
  get isEmpty() {
    return idx === 0;
  },
  get isEnd() {
    return idx === _stack.length - 1;
  },
};
