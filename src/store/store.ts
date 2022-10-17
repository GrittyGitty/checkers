import { storageBackend } from "./storageBackend";

const { fetch, persist, reset, compileSharingUrl } = storageBackend;

export const store = {
  get serialized() {
    return fetch();
  },
  set serialized({ grid, turn }) {
    persist({ grid, turn });
  },
  reset,
  get share() {
    return compileSharingUrl();
  }
};
