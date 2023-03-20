const { resolve } = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const webpack = require('webpack');
const { merge } = require('webpack-merge');

const commonConfig = require('./webpack.config.js');
const { getAssets, withTimestamp } = require('./webpack.product.utils');
const HtmlInjectWebpackPlugin = require('./HtmlInjectWebpackPlugin.js');
const excludedFromVendor = require('./excludedFromVendor.js');

const main = resolve('src/index.ts');
const sso = require.resolve('@cloudbeaver/plugin-sso/src/index.ts');
const ssoHtmlTemplate = require.resolve('@cloudbeaver/plugin-sso/src/index.html.ejs');
const outputDir = resolve('lib');
const package = require(resolve('package.json'));

const timestampVersion = withTimestamp(package.version);

module.exports = (env, argv) => merge(commonConfig(env, argv), {
  entry: {
    main,
    sso,
  },
  output: {
    filename: 'index.[contenthash].js',
    chunkFilename: '[name].[contenthash].bundle.js',
    library: package.name,
    libraryTarget: 'umd',
    path: outputDir,
    pathinfo: false,
  },
  optimization: {
    minimize: true,

    minimizer: [new TerserPlugin({
      extractComments: /Copyright \(C\)/i,
      terserOptions: {
        keep_classnames: true,
        keep_fnames: true,
      },
    })],
  },
  plugins: [
    new CopyWebpackPlugin({
      patterns: getAssets(package, ''),
    }),
    new webpack.DefinePlugin({
      _VERSION_: JSON.stringify(timestampVersion),
      _DEV_: false,
    }),
    new HtmlWebpackPlugin({
      template: resolve('src/index.html.ejs'),
      inject: 'body',
      chunks: ['main'],
      version: timestampVersion,
      title: package.product?.name,
    }),
    new HtmlWebpackPlugin({
      filename: 'sso.html',
      template: ssoHtmlTemplate,
      inject: 'body',
      chunks: ['sso'],
      version: timestampVersion,
      title: package.product?.name,
    }),
    new HtmlInjectWebpackPlugin({
      body: [{ attributes: { hidden: true }, tagName: 'object', innerHTML: '{STATIC_CONTENT}', voidTag: false }],
    }),
  ],
});
