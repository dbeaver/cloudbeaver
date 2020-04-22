// shared config (dev and prod)
const webpack = require('webpack');
const ModuleDependencyWarning = require("webpack/lib/ModuleDependencyWarning");
const path = require('path');
const CircularDependencyPlugin = require('circular-dependency-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');


// Temporary solution to remove wrong warning messages (it's was fixed https://github.com/microsoft/TypeScript/pull/35200 in typescript 3.8)
class IgnoreNotFoundExportPlugin {
  apply(compiler) {
    const messageRegExp = /export '.*'( \(reexported as '.*'\))? was not found in/
    function doneHook(stats) {
      stats.compilation.warnings = stats.compilation.warnings.filter(function (warn) {
        if (warn instanceof ModuleDependencyWarning && messageRegExp.test(warn.message)) {
          return false
        }
        return true;
      })
    }
    if (compiler.hooks) {
      compiler.hooks.done.tap("IgnoreNotFoundExportPlugin", doneHook)
    } else {
      compiler.plugin("done", doneHook)
    }
  }
}

module.exports = (env, argv) => {

  function generateStyleLoaders(options = { hasModule: false, hasReshadow: false }) {
    const modules = {
      mode: options.hasModule ? 'local' : 'global',
      localIdentName: '[local]___[hash:base64:5]',
    };

    const postCssPlugins = [
      require('postcss-preset-env')({ stage: 0 }),
      require('@csstools/postcss-sass')({
        includePaths: ['node_modules', path.resolve('../../node_modules')],
      }),
      require('postcss-discard-comments'),
    ];

    if (options.hasReshadow) {
      postCssPlugins.push(require('reshadow/postcss'));
    }

    // 'use' clause in webpack rules
    return [
      {
        loader: MiniCssExtractPlugin.loader,
        options: {
          hot: argv.mode !== 'production',
        },
      },
      {
        loader: 'css-loader',
        options: {
          importLoaders: 1,
          modules: modules,
        }
      },
      {
        loader: 'postcss-loader',
        options: {
          syntax: 'postcss-scss',
          plugins: postCssPlugins,
        },
      },
    ];
  }

  return {
    resolve: {
      extensions: ['.ts', '.tsx', '.js', '.jsx'],
    },
    module: {
      rules: [
        {
          test: /\.js$/,
          use: [
            {
              loader: 'babel-loader',
              options: {
                configFile: path.join(__dirname, '../babel.config.js')
              },
            },
            'source-map-loader'
          ],
          exclude: /node_modules/,
        },
        {
          test: /\.tsx?$/,
          use: [
            {
              loader: 'babel-loader',
              options: {
                configFile: path.join(__dirname, '../babel.config.js')
              },
            },
            {
              loader: 'eslint-loader',
              // uncomment to fix after rule changes
              // options: {
              //   fix: true,
              // },
            }
          ],
        },
        {
          test: /\.(css|scss|sass)$/,
          oneOf: [
            // css-module files ( should have *.module mask )
            {
              test: /\.module\.(css|scss|sass)$/,
              use: generateStyleLoaders({ hasModule: true, hasReshadow: true }),
            },
            // not css-module files - 3 ways to treat them
            {
              test: /\.raw\.(css|scss|sass)$/,
              use: generateStyleLoaders({ hasModule: false, hasReshadow: false }),
            },
            {
              include: /node_modules/,
              use: [
                {
                  loader: MiniCssExtractPlugin.loader,
                  options: {
                    hot: argv.mode !== 'production',
                  },
                },
                'css-loader',
              ]
            },
            {
              use: generateStyleLoaders({ hasModule: false, hasReshadow: true }),
            }
          ]
        },
        {
          test: /\.(png|jpe?g|gif|svg|eot|ttf|woff|woff2)$/i,
          loader: 'url-loader',
          options: {
            limit: 8192,
          },
        },
      ],
    },
    optimization: {
      minimize: false,
      namedModules: true,
      concatenateModules: false,
    },
    plugins: [
      new IgnoreNotFoundExportPlugin(),
      new webpack.ProgressPlugin({
        entries: true,
        modules: true,
        modulesCount: 100,
        profile: true,
        handler: (percentage, message, ...args) => {
          // custom logic
        }
      }),
      new CircularDependencyPlugin({
        // exclude detection of files based on a RegExp
        exclude: /a\.js|node_modules/,
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
  };
};
