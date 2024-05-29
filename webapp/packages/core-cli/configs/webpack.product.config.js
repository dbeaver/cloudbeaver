/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
const { resolve } = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const webpack = require('webpack');
const { merge } = require('webpack-merge');

const commonConfig = require('./webpack.config.js');
const { getAssets, withTimestamp } = require('./webpack.product.utils');
const HtmlInjectWebpackPlugin = require('../utils/HtmlInjectWebpackPlugin.js');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');

const ssoHtmlTemplate = require.resolve('@cloudbeaver/plugin-sso/src/index.html.ejs');
const ssoErrorHtmlTemplate = require.resolve('@cloudbeaver/plugin-sso/src/ssoError.html.ejs');
const outputDir = resolve('lib');
const package = require(resolve('package.json'));

const timestampVersion = withTimestamp(package.version);

module.exports = (env, argv) => {
  const devMode = argv.mode !== 'production';

  return merge(commonConfig(env, argv), {
    mode: 'production',
    devtool: false,
    output: {
      filename: 'index.[contenthash].public-ce.js',
      chunkFilename(module) {
        return '[name].[contenthash].bundle.public-ce.js';
      },
      library: package.name,
      libraryTarget: 'umd',
      path: outputDir,
    },
    optimization: {
      splitChunks: {
        cacheGroups: {
          asyncCommons: {
            filename: '[name].[contenthash].public-ce.js',
          },
          packages: {
            filename: '[name].[contenthash].public-ce.js',
          },
          locale: {
            filename: '[name].[contenthash].locale.public-ce.js',
          },
        },
      },
      minimize: true,

      minimizer: [
        new TerserPlugin({
        extractComments: {
          condition: /Copyright \(C\)/i,
          filename: 'license.txt',
        },
        terserOptions: {
          keep_classnames: true,
          keep_fnames: true,
        },
        include: [/.*.public-ce..*$/, /^cloudbeaver\/.*/, /^service-worker.js$/],
        exclude: [/^cloudbeaver-ee\/.*/, /.*.private-ee..*$/],
      }),
      new CssMinimizerPlugin(),
    ],
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
      new HtmlWebpackPlugin({
        filename: 'ssoError.html',
        template: ssoErrorHtmlTemplate,
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
};
