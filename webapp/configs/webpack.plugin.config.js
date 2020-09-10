const { merge } = require('webpack-merge');
const { resolve, join } = require('path');
var PeerDepsExternalsPlugin = require('peer-deps-externals-webpack-plugin');
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
    libraryTarget: 'commonjs',
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
  plugins: [
    new PeerDepsExternalsPlugin(),
  ],
});
