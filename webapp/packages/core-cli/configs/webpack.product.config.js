const { resolve } = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const TerserPlugin = require('terser-webpack-plugin')
const webpack = require('webpack')
const { merge } = require('webpack-merge');

const commonConfig = require('./webpack.config.js')
const { getAssets, withTimestamp } = require('./webpack.product.utils')

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
          test: /[\\/]node_modules[\\/](?!(leaflet|react-leaflet|react-data-grid))(.[a-zA-Z0-9.\-_]+)[\\/]/,
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
      version: timestampVersion,
    }),
  ],
});
