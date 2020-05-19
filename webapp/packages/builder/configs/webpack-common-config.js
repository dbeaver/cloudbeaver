/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

const webpack = require('webpack');
const CircularDependencyPlugin = require('circular-dependency-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const StringReplacePlugin = require("string-replace-webpack-plugin");
const resolve = require('resolve');
const path = require('path');
const fs = require('fs');

function replacementWithPluginImportCode(pluginsList) {

  let code = '';
  const names = [];
  console.info('build with plugins:');
  console.info(pluginsList);

  pluginsList.forEach(plugin => {
    const name = plugin
      .split('')
      .filter(char => /[a-zA-Z]/.test(char))
      .join('');
    names.push(name);

    code += `import ${name} from '${plugin}';\n`;
  })
  code += `
const PLUGINS = [
${names.map(n => `  ${n},\n`).join('')}]`;
  return code;
}

function dirExists(path) {
  try {
    const stats = fs.statSync(path)
    return stats && stats.isDirectory()
  } catch (e) {
    return false;
  }
}

function copyPublic(currentDir, pluginsList) {
  const pathsToCopy = [];
  pluginsList.forEach(plugin => {
    try {
      const pathToPlugin = resolve.sync(plugin);
      const dir = path.parse(pathToPlugin).dir;
      const pathToPublic = path.resolve(dir, '../public');
      if (dirExists(pathToPublic)) {
        pathsToCopy.push({
          from: pathToPublic,
          to: '',
        });
      }
    } catch (e) {
      console.error(e);
    }
  });
  const pathToAppPublic = path.resolve(currentDir, './public')
  if (dirExists(pathToAppPublic)) {
    pathsToCopy.push({from: path.resolve(currentDir, './public'), to: ''});
  }
  return pathsToCopy;
}

module.exports = (env, argv) => {
  return {
    context: path.resolve(__dirname, '../src'),
    resolve: {
      extensions: ['.js'],
      alias: {
        react: 'preact/compat',
        react$: 'preact/compat',
        'react-dom': 'preact/compat',
        'react-dom$': 'preact/compat',
      },
    },
    module: {
      rules: [
        {
          test: /\.js$/,
          use: [
            {
              loader: 'babel-loader',
              options: {
                configFile: path.join(__dirname, 'babel-app.config.js')
              },
            },
            {
              loader: StringReplacePlugin.replace({
                /**
                 * This replacement allows to put into the build the plugins that were mentioned in package.json
                 */
                replacements: [
                  {
                    pattern: /const PLUGINS = \[]/ig,
                    replacement: function (match, p1, offset, string) {
                      return replacementWithPluginImportCode(argv.pluginsList);
                    }
                  }
                ]
              })
            },
            'source-map-loader'
          ],
          exclude: /node_modules/,
        },
      ],
    },
    plugins: [
      new CopyWebpackPlugin(copyPublic(argv.currentDir, argv.pluginsList)),
      new HtmlWebpackPlugin({
        template: path.resolve(argv.currentDir, './index.html.ejs'),
      }),
      new webpack.DefinePlugin({
        version: JSON.stringify(require(path.resolve(argv.currentDir, './package.json')).buildVersion),
      }),
      new CircularDependencyPlugin({
        // exclude detection of files based on a RegExp
        // exclude: /\.js|node_modules/,
        // include specific files based on a RegExp
        // include: /dir/,
        // add errors to webpack instead of warnings
        failOnError: false,
        // allow import cycles that include an asyncronous import,
        // e.g. via import(/* webpackMode: "weak" */ './file.js')
        allowAsyncCycles: false,
        // set the current working directory for displaying module paths
        cwd: process.cwd(),
      }),
      new MiniCssExtractPlugin({
        // Options similar to the same options in webpackOptions.output
        // all options are optional
        filename: argv.mode !== 'production' ? '[name].css' : '[name].[hash].css',
        chunkFilename: argv.mode !== 'production' ? '[name].css' : '[name].[hash].css',
        ignoreOrder: false, // Enable to remove warnings about conflicting order
      }),
      // new webpack.optimize.LimitChunkCountPlugin({
      //   maxChunks: 1,
      // }),
    ],
    performance: {
      hints: false,
    },
    optimization: {
      minimize: false,
      namedModules: true,
      concatenateModules: false,
    },
  };
};
