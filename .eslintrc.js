module.exports = {
  env: {
    node: true,
    mocha: true
  },
  extends: [ 
    "airbnb-base",
    "plugin:@typescript-eslint/recommended",
    "prettier",
    "prettier/@typescript-eslint"
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: "./tsconfig.json"
  },
  plugins: ["@typescript-eslint"],
  rules: {
    "import/order":["off"],
    "@typescript-eslint/explicit-function-return-type": ["off"],
    "@typescript-eslint/no-use-before-define": ["error", "nofunc"],
    "@typescript-eslint/prefer-interface": ["off"],
    "import/no-extraneous-dependencies": [
      "error",
      { devDependencies: ["test/**/*.ts"] }
    ],
    "@typescript-eslint/no-floating-promises": ["error"],
    "no-use-before-define": ["error", "nofunc"],
    "no-console": ["off"],
    "no-plusplus": ["error", { allowForLoopAfterthoughts: true }],

    "@typescript-eslint/no-non-null-assertion": ["off"],
    "import/extensions": ["off"],
    "no-param-reassign": ["off"],
    "@typescript-eslint/no-explicit-any": ["off"],
    "no-loop-func": ["off"],
    "@typescript-eslint/explicit-module-boundary-types": ["off"]
  },
  settings: {
    "import/resolver": {
      node: {
        extensions: [".ts"]
      }
    }
  }
};
