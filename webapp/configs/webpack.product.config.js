const { merge } = require('webpack-merge');
const webpack = require('webpack');
const { resolve } = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin')

const commonConfig = require('./webpack.config.js');
const { withTimestamp, getAssets } = require('./webpack.product.utils');

const main = resolve('src/index.ts');
const outputDir = resolve('lib');
const package = require(resolve('package.json'))

const timestampVersion = withTimestamp(package.version);

module.exports = (env, argv) => merge(commonConfig(env, argv), {
  entry: main,
  output: {
    filename: 'index.[contenthash].js',
    chunkFilename: '[name].[contenthash].bundle.js',
    library: package.name,
    libraryTarget: 'umd',
    path: outputDir,
  },
  optimization: {
    runtimeChunk: 'single',
    moduleIds: 'hashed',
    splitChunks: {
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/](?!@ag-grid)(.[a-zA-Z0-9.\-_]+)[\\/]/,
          name: 'vendors',
          chunks: 'all',
        },
      },
    },
    usedExports: true,
    sideEffects: true,
    minimize: true,
    namedModules: true,
    concatenateModules: true,
  },
  plugins: [
    new CopyWebpackPlugin({
      patterns: getAssets(package, ''),
    }),
    new webpack.DefinePlugin({
      _VERSION_: JSON.stringify(timestampVersion),
    }),
    new HtmlWebpackPlugin({ template: resolve('src/index.html.ejs'), inject: 'html', version: timestampVersion }),
  ],
});
