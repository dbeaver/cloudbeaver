const merge = require('webpack-merge');
const { resolve, join } = require('path');
const commonConfig = require('./webpack.config.js');

var main = resolve('src/index.ts');
var outputDir = resolve('lib');
var package = require(resolve("package.json"));
module.exports = (env, argv) => merge(commonConfig(env, argv), {
  entry: main,
  output: {
    filename: 'index.js',
    chunkFilename: '[name].bundle.js',
    library: package.name,
    libraryTarget: 'umd',
    path: outputDir,
  },
  optimization: {
    // splitChunks: {
    //   chunks: 'all',
    // },
    // minimize: false,
    // namedModules: false,
    // concatenateModules: false,
  },
  plugins: [],
});
