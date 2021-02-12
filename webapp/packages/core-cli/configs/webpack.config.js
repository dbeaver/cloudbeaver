const { resolve, join } = require('path');
const ModuleDependencyWarning = require("webpack/lib/ModuleDependencyWarning");
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
// const ESLintPlugin = require('eslint-webpack-plugin');

class IgnoreNotFoundExportPlugin {
  apply(compiler) {
    const messageRegExp = /export '.*'( \(imported as '.*'\))? was not found in/
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

const nodeModules = [
  resolve('node_modules'), // product
  resolve('../../node_modules'), // workspace
  resolve('../../node_modules/@cloudbeaver/core-cli/node_modules') // core-cli
]

module.exports = (env, argv) => {
  process.env.NODE_ENV = argv.mode;
  const devTool = 'source-map' in env && 'source-map';
  const devMode = argv.mode !== 'production';
  function getBaseStyleLoaders() {
    const loaders = [];

    // Broke styles order in dev mode
    // if(devMode) {
      // loaders.push('style-loader')
    // }else{
      loaders.push(MiniCssExtractPlugin.loader);
    // }

    return loaders;
  }

  function generateStyleLoaders(options = { hasModule: false }) {
    const moduleScope = options.hasModule ? 'local' : 'global';
    const modules = {
      mode: moduleScope,
      localIdentName: '[local]___[hash:base64:5]',
    };

    const postCssPlugins = [
      require('postcss-preset-env')({ stage: 0 }),
      // require('postcss-discard-comments'),
      require('reshadow/postcss')({ scopeBehaviour: moduleScope })
    ];

    return [
      ...getBaseStyleLoaders(),
      {
        loader: 'css-loader',
        options: {
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
            includePaths: nodeModules
          },
        }
      }
    ];
  }

  var babelLoader = {
    loader: 'babel-loader',
    options: {
      configFile: join(__dirname, 'babel.config.js'),
    },
  }

  return {
    // target: !devMode ? "web" : "browserslist",
    cache: true,
    resolve: {
      extensions: ['.ts', '.tsx', '.js'],
      modules: nodeModules,
      alias: {
        react: 'preact/compat',
        react$: 'preact/compat',
        'react-dom': 'preact/compat',
        'react-dom$': 'preact/compat',
      },
    },
    resolveLoader: {
      modules: nodeModules
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
                ...getBaseStyleLoaders(),
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
    devtool: devTool,
    plugins: [
      // new ESLintPlugin(options), //TODO: maybe later
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
        filename: devMode ? '[name].css' : '[name].[contenthash].css',
        chunkFilename: devMode ? '[id].css' : '[id].[contenthash].css',
        ignoreOrder: false, // Enable to remove warnings about conflicting order
      }),
    ]
  };
};
