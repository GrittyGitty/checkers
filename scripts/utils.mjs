import { HTML } from './consts.mjs';

import replace from "replace-in-file";

const transform = (command, transform) => command.then((raw) => {
  const val = String(raw).trim();
  return transform?.(val) ?? val;
})

const hasChanges = (filename) => transform($`git diff head ${filename} | wc -l`, (val) => !!Number(val));

const replaceHTML = (from, to) => replace({ files: HTML, from, to });

const escapeDots = (val) => val.replace(/\./g, "\\.");

const embedShaIntoScript = (sha, suffix) => {
  return replaceHTML(
    new RegExp(`(?<=dist\/)[^.]*?\\.(?=.*${escapeDots(suffix)})`, "g"),
    `${sha}.`
  );
};

export { transform, hasChanges, replaceHTML, embedShaIntoScript }
