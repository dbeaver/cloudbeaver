/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
const { resolve } = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const PeerDepsExternalsPlugin = require('peer-deps-externals-webpack-plugin');
const { merge } = require('webpack-merge');

const commonConfig = require('./webpack.config.js');

const index = resolve('src/index.ts');
const outputDir = resolve('lib');
const package = require(resolve('package.json'));

module.exports = (env, argv) => merge(commonConfig(env, argv), {
  entry: {
    // [package.name.replace('@cloudbeaver/', '')]: index,
    
    index,
  },
  output: {
    filename: '[name].public-ce.js',
    chunkFilename(module) {
      return '[name].[contenthash].bundle.public-ce.js';
    },
    library: package.name,
    libraryTarget: 'commonjs',
    path: outputDir,
  },
  externals: /^@cloudbeaver\/.+$/i,
  plugins: [
    new PeerDepsExternalsPlugin(),
  ],
});
