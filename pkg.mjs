#!/usr/bin/env zx

$.verbose = false

import replace from "replace-in-file";

const sha = String(await $`git rev-parse --short HEAD`).trim();

const move = (file) => $`mv ${file} dist/${sha}.${file}`;
const copy = (file) => $`cp ${file} dist/${sha}.${file}`;

await Promise.all([
  $`find dist -maxdepth 1 -type f -delete`,
  replace({
    files: "index.html",
    from: [/data-head-during-build=".*"/, new RegExp(`(?<=dist\/)[^.]*?\\.(?=.*(js|css))`, "g")],
    to: [`data-head-during-build="${sha}"`, `${sha}.`]
  }),
  copy("index.css"),
  copy("index.js"),
  copy("commit.js"),
  move("index.min.js").then(() => replace({
    files: `dist/${sha}.index.min.js`,
    from: new RegExp("(?<=sourceMappingURL=).*?\\.(?=index)"),
    to: `${sha}.`
  })),
  move("index.min.js.map").then(() => replace({
    files: `dist/${sha}.index.min.js.map`,
    from: new RegExp("index.js"),
    to: `${sha}.index.js`
  }))]
);