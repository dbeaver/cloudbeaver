const { merge } = require('webpack-merge');
const webpack = require('webpack');
const { resolve } = require('path')

const commonConfig = require('./webpack.config.js')

const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin')

const { getAssets } = require('./webpack.product.utils');

const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

const package = require(resolve('package.json'))

module.exports = (env, argv) => merge(commonConfig(env, argv), {
  entry: [
    'webpack-dev-server/client?http://localhost:3100',
    './src/index.ts',
  ],
  mode: 'development',
  devServer: {
    hot: true,
    proxy: {
      '/api': {
        target: env.server,
      },
    },
  },
  devtool: 'eval-source-map',
  optimization: {
    moduleIds: "named"
  },
  plugins: [
    new CopyWebpackPlugin({
      patterns: getAssets(package, ''),
    }),
    new webpack.DefinePlugin({
      _VERSION_: JSON.stringify(package.version),
    }),
    new HtmlWebpackPlugin({ template: resolve('src/index.html.ejs'), inject: 'html', version: package.version }),
    // new webpack.HotModuleReplacementPlugin(),
    // new BundleAnalyzerPlugin()
  ],
});
