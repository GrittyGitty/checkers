#!/usr/bin/env zx

$.verbose = false

import { hasChanges, transform, replaceHTML, embedShaIntoScript } from './scripts/utils.mjs';
import { COMMIT, CSS, JS, MAP, MIN } from './scripts/consts.mjs';


const [sha, beforeHead] = await Promise.all([$`git rev-parse --short HEAD`, $`git rev-parse --short HEAD~1`].map((s) => transform(s)));



const copy = (file) => $`cp ${file} dist/${sha}.${file}`;
const rm = (files) => Promise.all(files.map(f => $`rm -f dist/${beforeHead}.${f}`));
const seq = (main, { embed = main, rem = [main] } = {}) => [copy(main), embedShaIntoScript(sha, embed), rm(rem)];

await Promise.all([
  replaceHTML(
    /data-head-during-build=".*"/,
    `data-head-during-build="${sha}"`
  ),
  hasChanges(JS).then((has) => has && Promise.all([
    $`uglifyjs ${JS} -cmo dist/${sha}.${MIN} --source-map url=${MAP}`,
    ...seq(JS, { embed: MIN, rem: [JS, MIN, MAP] })
  ])),
  hasChanges(CSS).then((has) => has && Promise.all(seq(CSS))),
  hasChanges(COMMIT).then(has => has && Promise.all(seq(COMMIT))),
]);


