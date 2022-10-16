#!/usr/bin/env zx

$.verbose = false

import replace from "replace-in-file";

const deleteOldFiles = $`find dist -maxdepth 1 -type f -delete`;
const sha = String(await $`git rev-parse --short HEAD`).trim();

const copy = (file) => $`cp ${file} dist/${sha}.${file}`;


const uglifyJs = $`uglifyjs index.js -cmo dist/${sha}.index.min.js --source-map url=index.min.js.map`;
const replaceHtmlWithNewSha = replace({
  files: "index.html",
  from: [/data-head-during-build=".*"/, new RegExp(`(?<=dist\/)[^.]*?\\.(?=.*(js|css))`, "g")],
  to: [`data-head-during-build="${sha}"`, `${sha}.`]
});

await Promise.all([
  deleteOldFiles,
  uglifyJs,
  replaceHtmlWithNewSha,
  copy("index.css"),
  copy("index.js"),
  copy("commit.js")
]);