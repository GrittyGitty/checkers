import { viteSingleFile } from "vite-plugin-singlefile"

/** @type {import('vite').UserConfig} */
export default {
  build: {
    sourcemap: true,
  },
  base: "./",
  plugins: [viteSingleFile({ inlinePattern: ["assets/*.css", "cellsize.js"], useRecommendedBuildConfig: false })]
}