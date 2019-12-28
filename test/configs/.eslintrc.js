module.exports = {
  env: {
    node: true,
  },
  extends: [
    "airbnb-base",
    "plugin:@typescript-eslint/recommended",
    "prettier",
    "prettier/@typescript-eslint"
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: "test/configs/tsconfig.json"
  },
  plugins: ["@typescript-eslint"],
  rules: { // TODO: remove some rule overrides after disabling eslint on model customization tests(?)
    "import/extensions": ["off"],
    "import/prefer-default-export": ["off"],
    "@typescript-eslint/no-explicit-any": ["off"],
    "@typescript-eslint/camelcase": ["off"],
    "@typescript-eslint/class-name-casing": ["off"]
  },
  settings: {
    "import/resolver": {
      node: {
        extensions: [".ts"]
      }
    }
  }
};
