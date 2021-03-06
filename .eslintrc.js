module.exports = {
  env: {
    es6: true,
    node: true,
  },
  ignorePatterns: ["src/protos/gen/"],
  extends: [
    'airbnb-base',
    "plugin:@typescript-eslint/recommended",
  ],
  globals: {
    Atomics: 'readonly',
    SharedArrayBuffer: 'readonly',
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module',
  },
  plugins: [
    '@typescript-eslint',
  ],
  settings: {
    "import/resolver": {
      node: {
        extensions: [".js", ".jsx", ".ts", ".tsx"],
        moduleDirectory: ['node_modules', 'src/'],
      },
    },
  },
  rules: {
    "import/extensions": "off"
  },
};
