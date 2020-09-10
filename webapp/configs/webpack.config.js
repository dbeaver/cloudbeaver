const { resolve, join } = require('path');
const ModuleDependencyWarning = require("webpack/lib/ModuleDependencyWarning");
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');

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
  function generateStyleLoaders(options = { hasModule: false }) {
    const moduleScope = options.hasModule ? 'local' : 'global';
    const modules = {
      mode: moduleScope,
      localIdentName: '[local]___[hash:base64:5]',
    };

    const postCssPlugins = [
      require('postcss-preset-env')({ stage: 0 }),
      require('postcss-discard-comments'),
      require('reshadow/postcss')({ scopeBehaviour: moduleScope })
    ];

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
          sourceMap: true,
        }
      },
      {
        loader: 'postcss-loader',
        options: {
          postcssOptions: {
            plugins: postCssPlugins,
            sourceMap: true,
          }
        },
      },
      {
        loader: 'sass-loader',
        options: {
          sourceMap: true,
          sassOptions: {
            implementation: require('node-sass'),
            includePaths: [resolve('node_modules'), resolve('../../node_modules')]
          },
        }
      }
    ];
  }

  process.env.NODE_ENV = argv.mode || 'development'

  var babelLoader = {
    loader: 'babel-loader',
    options: {
      configFile: join(__dirname, 'babel.config.js'),
    },
  }

  return {
    cache: true,
    mode: argv.mode || 'development',
    resolve: {
      extensions: ['.ts', '.tsx', '.js'],
      modules: [resolve('node_modules'), resolve('../../node_modules')],
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
          test: /\.json5$/i,
          loader: 'json5-loader',
          type: 'javascript/auto',
        },
        {
          test: /\.(ts|js)x?$/,
          exclude: /node_modules/,
          use: [
            // 'reshadow/webpack/loader',
            babelLoader
          ]
        },
        {
          test: /\.(css|s[ac]ss)$/,
          oneOf: [
            {
              test: /\.module\.(css|s[ac]ss)$/,
              use: generateStyleLoaders({ hasModule: true }),
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
                'sass-loader'
              ]
            },
            {
              use: generateStyleLoaders({ hasModule: false }),
            }
          ]
        },
      ]
    },
    // externals: [
    //   function (context, request, callback) {
    //     if (/^@cloudbeaver\/.+$/.test(request)) {
    //       return callback(null, request, 'amd');
    //     }

    //     callback();
    //   },
    // ],
    devtool: 'cheap-module-source-map',
    plugins: [
      new ForkTsCheckerWebpackPlugin({
        typescript: {
          diagnosticOptions: {
            semantic: true,
            syntactic: true,
          },
        },
      }),
      new IgnoreNotFoundExportPlugin(),
      new MiniCssExtractPlugin({
        // Options similar to the same options in webpackOptions.output
        // all options are optional
        filename: argv.mode !== 'production' ? '[name].css' : '[name].[hash].css',
        chunkFilename: argv.mode !== 'production' ? '[name].css' : '[name].[hash].css',
        ignoreOrder: false, // Enable to remove warnings about conflicting order
      }),
    ]
  };
};
