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
const { EsbuildPlugin } = require('esbuild-loader');
const { merge } = require('webpack-merge');

const commonConfig = require('./webpack.config.js');
const { getAssets, withTimestamp } = require('./webpack.product.utils');
const HtmlInjectWebpackPlugin = require('../utils/HtmlInjectWebpackPlugin.js');

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
      library: package.name,
      libraryTarget: 'umd',
      path: outputDir,
    },
    optimization: {
      minimize: true,

      minimizer: [
        new EsbuildPlugin({
            include: /.*?\/(core|plugin|main|sso|packages)-.*/,
            target: 'es2023',
            keepNames: true,
        }),
        new EsbuildPlugin({
            exclude: /.*?\/(core|plugin|main|sso|packages)-.*/,
            target: 'es2023',
            css: true,
        }),
    ],
    },
    plugins: [
      new CopyWebpackPlugin({
        patterns: getAssets(package, ''),
      }),
      new EsbuildPlugin({
          define: {
            _VERSION_: JSON.stringify(timestampVersion),
            _DEV_: JSON.stringify(false),
          },
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
