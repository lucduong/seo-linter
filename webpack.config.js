'use strict';

const webpack = require('webpack');
const path = require('path');
const fs = require('fs');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const buildMode = process.env.WEBPACK_ENV === 'build';

let nodeModules = {};
fs
  .readdirSync('node_modules')
  .filter(function(x) {
    return ['.bin'].indexOf(x) === -1;
  })
  .forEach(function(mod) {
    nodeModules[mod] = 'commonjs ' + mod;
  });

let plugins = [
  new UglifyJSPlugin({
    sourceMap: process.env.WEBPACK_ENV === 'dev'
  }),
  new webpack.LoaderOptionsPlugin({
    minimize: true
  })
];

if (buildMode) {
  plugins = [
    new BundleAnalyzerPlugin({
      analyzerMode: 'static'
    }),
    ...plugins
  ];
}

module.exports = {
  target: 'node',
  node: {
    console: false,
    global: false,
    process: false,
    Buffer: false,
    __filename: true,
    __dirname: true
  },

  entry: {
    index: './src/index.js',
    vendor: [
      'chalk',
      'cheerio',
      'clui',
      'commander',
      'figlet',
      'js-yaml',
      'lodash',
      'request',
      'request-promise',
      'regenerator-runtime'
    ]
  },

  output: {
    path: path.join(__dirname, 'lib'),
    filename: '[name].js',
    libraryTarget: 'umd'
  },

  externals: nodeModules,

  devtool: 'sourcemap',

  module: {
    noParse: /es6-promise\.js$/, // avoid webpack shimming process
    rules: [
      {
        test: /\.js$/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['env']
          }
        },
        exclude: [/node_modules/, /vendor/]
      }
    ]
  },

  plugins
};
