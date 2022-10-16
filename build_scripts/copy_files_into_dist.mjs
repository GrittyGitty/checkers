#!/usr/bin/env zx

$.verbose = false

await Promise.all([
  $`cp index.css dist/index.css`,
  $`cp index.js dist/index.js`,
  $`cp commit.js dist/commit.js`,
]);