const { getAssets, withTimestamp, requireOriginal } = require('./webpack.product.utils');
const { merge } = requireOriginal('webpack-merge');
const webpack = requireOriginal('webpack');
const { resolve } = require('path');
const HtmlWebpackPlugin = requireOriginal('html-webpack-plugin');
const CopyWebpackPlugin = requireOriginal('copy-webpack-plugin');
const TerserPlugin = requireOriginal("terser-webpack-plugin");

const commonConfig = require('./webpack.config.js');

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
    minimize: true,
    runtimeChunk: 'single',
    moduleIds: 'deterministic',
    splitChunks: {
      cacheGroups: {
        vendor: {
          // TODO: we need another way to detect libraries to exclude
          test: /[\\/]node_modules[\\/](?!(@ag-grid|react-data-grid))(.[a-zA-Z0-9.\-_]+)[\\/]/,
          name: 'vendors',
          chunks: 'all',
        },
      },
    },
    usedExports: true,
    sideEffects: true,
    concatenateModules: true,
    
    minimizer: [new TerserPlugin({
      extractComments: /Copyright \(C\)/i,
    })],
  },
  plugins: [
    new CopyWebpackPlugin({
      patterns: getAssets(package, ''),
    }),
    new webpack.DefinePlugin({
      _VERSION_: JSON.stringify(timestampVersion),
    }),
    new HtmlWebpackPlugin({ 
      template: resolve('src/index.html.ejs'), 
      inject: 'body', 
      version: timestampVersion 
    }),
  ],
});
