#!/usr/bin/env zx

$.verbose = false


const replace = require("replace-in-file");
const sha = String(await $`git rev-parse --short HEAD`).trim();

await replace({
  files: "index.html",
  from: /data-head-during-build=".*"/,
  to: `data-head-during-build="${sha}"`
});