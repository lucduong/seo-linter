module.exports = {
  root: true,
  env: {
    browser: true,
    commonjs: true,
    es6: true,
    jquery: true,
    mocha: true,
    node: true
  },
  globals: { _: true },
  extends: 'eslint:recommended',
  parserOptions: {
    sourceType: 'module',
    ecmaVersion: 2017,
    ecmaFeatures: {
      spread: true,
      experimentalObjectRestSpread: true
    }
  },
  rules: {
    quotes: ['warn', 'single'],
    'no-var': ['error'],
    'no-console': ['off'],
    'no-unused-vars': ['off'],
    'no-mixed-spaces-and-tabs': ['warn'],
    'no-tabs': ['warn'],
    'no-extra-boolean-cast': ['off']
  }
};
