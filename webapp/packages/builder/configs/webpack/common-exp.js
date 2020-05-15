const merge = require('webpack-merge');
const commonConfig = require('./common-root');
const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const StringReplacePlugin = require("string-replace-webpack-plugin");

function replacementWithPluginImportCode(pathToList, currentDir) {
  const fullPath = path.resolve(currentDir, pathToList || './plugins-list')
  const pluginsList = require(fullPath);

  let code = '';
  const names = [];

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


module.exports = (env, argv) => merge(commonConfig(env, argv), {
  resolve: {
    alias: {
      // // rewrite imports for unnecessary work in `web/src/libs/sdk.ts`
      'graphql-tag': path.resolve(__dirname, '../../src/fix-gql.js'),
      graphql: path.resolve(__dirname, '../../src/fix-gql.js'),

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
                    return replacementWithPluginImportCode(argv.pluginsList, argv.currentDir);
                  }
                }
              ]})
          }
        ],
      },
    ],
  },
  plugins: [
    new CopyWebpackPlugin([ { from: path.resolve(argv.currentDir, './public'), to: '' } ]),
    new HtmlWebpackPlugin({
      template: path.resolve(argv.currentDir, './index.html.ejs'),
    }),
    new webpack.DefinePlugin({
      version: JSON.stringify(require(path.resolve(argv.currentDir, './package.json')).buildVersion),
    }),
  ],

});
