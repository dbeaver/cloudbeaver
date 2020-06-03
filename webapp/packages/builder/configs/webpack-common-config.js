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
const MergeJsonWebpackPlugin = require("merge-jsons-webpack-plugin");
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

/**
  * Search for locales in plugins and combine them together
  */
function combineLocales(contextPath, pluginsList) {
  const locales = new Map(); // { locale: array of paths}
  pluginsList.forEach(plugin => {
    try {
      const pathToPlugin = resolve.sync(plugin);
      const dir = path.parse(pathToPlugin).dir;
      const pathToLocales = path.resolve(dir, '../locales');
      if (dirExists(pathToLocales)) {
        fs.readdirSync(pathToLocales).forEach(file => {
          const fileParse = path.parse(file)
          if (fileParse.ext !== '.json') {
            return;
          }
          const fullFileName = path.join(pathToLocales, file);
          let relativeName = path.relative(contextPath, fullFileName);

          if (locales.has(fileParse.base)) {
            const pathList = locales.get(fileParse.base);
            pathList.push(relativeName)
          } else {
            locales.set(fileParse.base, [relativeName])
          }
        });
      }
    } catch (e) {
      console.error(e);
    }
  });
  const mergeJsonWebpackPluginGroupBy = [];
  locales.forEach((pathsList, name) => {
    const pattern = pathsList.length > 1
      ? `{${pathsList.join(',')}}`
      : pathsList[0];
    mergeJsonWebpackPluginGroupBy.push({
      pattern,
      fileName: `locales/${name}`,
    })
  })
  console.log('Locales');
  console.log(mergeJsonWebpackPluginGroupBy);
  return mergeJsonWebpackPluginGroupBy;
}

const contextPath = path.resolve(__dirname, '../src');

module.exports = (env, argv) => {
  return {
    context: contextPath,
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
              loader: StringReplacePlugin.replace({
              exclude: /node_modules/,
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
        },
      ],
    },
    plugins: [
      new CopyWebpackPlugin(copyPublic(argv.currentDir, argv.pluginsList)),
      new HtmlWebpackPlugin({
        template: path.resolve(argv.currentDir, './index.html.ejs'),
      }),
      new MergeJsonWebpackPlugin({
        debug: true,
        output: {
          groupBy: combineLocales(contextPath, argv.pluginsList),
        },
        globOptions: {
          debug: false,
          cwd: contextPath,
        }
      }),
      new webpack.DefinePlugin({
        version: JSON.stringify(require(path.resolve(argv.currentDir, './package.json')).buildVersion),
      }),
      new CircularDependencyPlugin({
        // exclude detection of files based on a RegExp
        exclude: /node_modules/,
        // include specific files based on a RegExp
        include: /@dbeaver/,
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
