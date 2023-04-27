module.exports = {
  env: {
    browser: true,
    es2021: true,
  },
  extends: ["standard-with-typescript", "prettier"],
  parser: "@typescript-eslint/parser",
  plugins: ["prettier"],
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
    project: ["./tsconfig.json"],
  },
  rules: {
    "prettier/prettier": ["error"],
    quotes: ["error", "double"],
    "prefer-template": "error",
    "@typescript-eslint/quotes": [
      "error",
      "double",
      {
        allowTemplateLiterals: true,
      },
    ],
    "@typescript-eslint/semi": "off",
    "@typescript-eslint/explicit-function-return-type": "off",
    "@typescript-eslint/consistent-type-definitions": ["error", "type"],
    "@typescript-eslint/strict-boolean-expressions": "off",
  },
};
