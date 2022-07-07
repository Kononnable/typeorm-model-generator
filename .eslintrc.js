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
    "@typescript-eslint/explicit-module-boundary-types": ["off"],
    'no-restricted-syntax': [
      'error',
      {
        selector: 'ForInStatement',
        message: 'for..in loops iterate over the entire prototype chain, which is virtually never what you want. Use Object.{keys,values,entries}, and iterate over the resulting array.',
      },
      {
        selector: 'LabeledStatement',
        message: 'Labels are a form of GOTO; using them makes code confusing and hard to maintain and understand.',
      },
      {
        selector: 'WithStatement',
        message: '`with` is disallowed in strict mode because it makes code impossible to predict and optimize.',
      },
    ],
  },
  settings: {
    "import/resolver": {
      node: {
        extensions: [".ts"]
      }
    }
  }
};
