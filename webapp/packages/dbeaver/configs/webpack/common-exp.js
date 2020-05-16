const merge = require('webpack-merge');
const commonConfig = require('../../../../configs/webpack/common');
const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const StringReplacePlugin = require("string-replace-webpack-plugin");
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');


module.exports = (env, argv) => merge(commonConfig(env, argv), {
  resolve: {
    alias: {
      react: 'preact/compat',
      react$: 'preact/compat',
      'react-dom': 'preact/compat',
      'react-dom$': 'preact/compat',
    },
  },
  context: path.resolve(__dirname, '../../src'),
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: [
          {
            loader: StringReplacePlugin.replace({
              /**
               * This replacement allows to put into the build the plugins that were mentioned in package.json
               */
              replacements: [
                {
                  pattern: /const PLUGINS = \[]/ig,
                  replacement: function (match, p1, offset, string) {
                    return `console.log('FOUND')`; // todo replace with plugin import
                  }
                }
              ]})
          }
        ],
      },
    ],
  },
  plugins: [
    new ForkTsCheckerWebpackPlugin({
      tsconfig: path.resolve(__dirname, '../../tsconfig.json'),
      async: false, // slow but run before dev-server starts todo try set true later
    }),
    new CopyWebpackPlugin([ { from: '../public', to: '' } ]),
    new HtmlWebpackPlugin({template: 'index.html.ejs',}),
    new webpack.DefinePlugin({
      dbeaverPlugins: JSON.stringify(require("../../package.json").dbeaverPlugins),
      version: JSON.stringify(require("../../package.json").buildVersion),
    }),
  ],

});
