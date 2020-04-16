const merge = require('webpack-merge');
const commonConfig = require('../../../../configs/webpack/common');
const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const StringReplacePlugin = require("string-replace-webpack-plugin");
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');

function replacementWithPluginImportCode(pathToList) {
  const fullPath = path.resolve(__dirname, pathToList || '../../plugins-list')
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
      "@dbeaver/core/assets": path.resolve(__dirname, "../../../core/assets"),

      "@dbeaver/core/app": path.resolve(__dirname, "../../../core/src/app"),
      "@dbeaver/core/blocks": path.resolve(__dirname, "../../../core/src/blocks"),
      "@dbeaver/core/di": path.resolve(__dirname, "../../../core/src/di"),
      "@dbeaver/core/dialogs": path.resolve(__dirname, "../../../core/src/dialogs"),
      "@dbeaver/core/eventsLog": path.resolve(__dirname, "../../../core/src/eventsLog"),
      "@dbeaver/core/localization": path.resolve(__dirname, "../../../core/src/localization"),
      "@dbeaver/core/root": path.resolve(__dirname, "../../../core/src/root"),
      "@dbeaver/core/sdk": path.resolve(__dirname, "../../../core/src/sdk"),
      "@dbeaver/core/settings": path.resolve(__dirname, "../../../core/src/settings"),
      "@dbeaver/core/theming": path.resolve(__dirname, "../../../core/src/theming"),
      "@dbeaver/core/utils": path.resolve(__dirname, "../../../core/src/utils"),

      // rewrite imports for unnecessary work in `web/src/libs/sdk.ts`
      'graphql-tag': path.join(__dirname, '../../fix-gql.js'),
      graphql: path.join(__dirname, '../../fix-gql.js'),

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
                    return replacementWithPluginImportCode(argv.pluginsList);
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

    /**
     * this plugin allows to resolve all @dbeaver/some-plugin packages
     */
    new webpack.NormalModuleReplacementPlugin(
      /@dbeaver\/[a-zA-z\-]*$/,
      resource => {
        resource.request = resource.request + '/src/index';
      }
    ),

    new CopyWebpackPlugin([ { from: '../public', to: '' } ]),
    new HtmlWebpackPlugin({template: 'index.html.ejs',}),
    new webpack.DefinePlugin({
      dbeaverPlugins: JSON.stringify(require("../../package.json").dbeaverPlugins),
      version: JSON.stringify(require("../../package.json").buildVersion),
    }),
  ],

});
