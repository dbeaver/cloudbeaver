const { resolve, join } = require('path')
const ModuleDependencyWarning = require('webpack/lib/ModuleDependencyWarning')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin')
const PnpWebpackPlugin = require(`pnp-webpack-plugin`);
const ExtraWatchWebpackPlugin = require('extra-watch-webpack-plugin');
// const ESLintPlugin = require('eslint-webpack-plugin');

class IgnoreNotFoundExportPlugin {
  apply (compiler) {
    const messageRegExp = /export '.*'( \(imported as '.*'\))? was not found in/;
    function doneHook (stats) {
      stats.compilation.warnings = stats.compilation.warnings.filter(warn => {
        if (warn instanceof ModuleDependencyWarning && messageRegExp.test(warn.message)) {
          return false;
        }
        return true
      });
    }
    if (compiler.hooks) {
      compiler.hooks.done.tap('IgnoreNotFoundExportPlugin', doneHook);
    } else {
      compiler.plugin('done', doneHook);
    }
  }
}

const nodeModules = [
  resolve('node_modules'), // product
  resolve('../../node_modules'), // workspace
  resolve('../../node_modules/@cloudbeaver/core-cli/node_modules'), // core-cli
];

module.exports = (env, argv) => {
  process.env.NODE_ENV = argv.mode
  const devTool = 'source-map' in env && 'source-map'
  const devMode = argv.mode !== 'production'
  function getBaseStyleLoaders () {
    const loaders = []

    // Broke styles order in dev mode
    // if (devMode) {
    //  loaders.push('style-loader');
    // } else {
    loaders.push(MiniCssExtractPlugin.loader)
    // }

    return loaders
  }

  function generateStyleLoaders (options = { hasModule: false, disable: false }) {
    const moduleScope = options.hasModule ? 'local' : 'global'
    let modules = {
      mode: moduleScope,
      localIdentName: '[local]___[hash:base64:5]',
    }

    if(options.disable) {
      modules = false;
    }

    const postCssPlugins = [
      require('postcss-preset-env')({ stage: 0 }),
      require('@reshadow/postcss')({ scopeBehaviour: moduleScope }),
    ]

    return [
      ...getBaseStyleLoaders(),
      {
        loader: 'css-loader',
        options: {
          modules: modules,
          sourceMap: true,
        },
      },

      {
        loader: 'postcss-loader',
        options: {
          postcssOptions: {
            plugins: postCssPlugins,
            sourceMap: true,
          },
        },
      },
      {
        loader: 'sass-loader',
        options: {
          sourceMap: true,
          sassOptions: {
            implementation: require('node-sass'),
            includePaths: nodeModules,
          },
        },
      },
    ]
  }

  var babelLoader = {
    loader: require.resolve('babel-loader'),
    options: {
      configFile: join(__dirname, 'babel.config.js'),
    },
  };

  return {
    // target: !devMode ? "web" : "browserslist",
    optimization: {
      removeAvailableModules: false,
      removeEmptyChunks: false,
      splitChunks: false
    },
    output: {
      pathinfo: false
    },
    resolve: {
      extensions: ['.ts', '.tsx', '.js'],
      modules: nodeModules,
      alias: {
        "react/jsx-dev-runtime": "react/jsx-dev-runtime.js",
        "react/jsx-runtime": "react/jsx-runtime.js",
      },
      fallback: {
        path: require.resolve("path-browserify"),
      },
      plugins: [
        PnpWebpackPlugin,
      ],
    },
    resolveLoader: {
      modules: nodeModules,
      plugins: [
        PnpWebpackPlugin.moduleLoader(module),
      ],
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
            'thread-loader',
            babelLoader,
          ],
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
                ...getBaseStyleLoaders(),
                'css-loader',
                'sass-loader',
              ],
            },
            {
              test: /\.(theme|pure)\.(css|s[ac]ss)$/,
              use: generateStyleLoaders({ disable: true }),
            },
            {
              use: generateStyleLoaders(),
            },
          ],
        },
        {
          test: /\.(png|jpg|gif)$/i,
          type: 'asset/inline',
        },
      ],
    },
    devtool: devTool,
    plugins: [
      new ForkTsCheckerWebpackPlugin({
        typescript: {
          diagnosticOptions: {
            semantic: true,
            syntactic: true,
          },
        },
      }),
      // new ExtraWatchWebpackPlugin({
      //   files: ['packages/*/src/**.ts', 'packages/*/src/**.tsx']
      // }),
      new IgnoreNotFoundExportPlugin(),
      new MiniCssExtractPlugin({
        // Options similar to the same options in webpackOptions.output
        // all options are optional
        filename: devMode ? '[name].css' : '[name].[contenthash].css',
        chunkFilename: devMode ? '[id].css' : '[id].[contenthash].css',
        ignoreOrder: false, // Enable to remove warnings about conflicting order
        insert: linkTag => {
          let reshadowObj = document.getElementById('__reshadow__');

          if(reshadowObj) {
            document.head.insertBefore(linkTag, reshadowObj);
          } else { 
            document.head.appendChild(linkTag)
          }
        }
      }),
    ],
  }
}
