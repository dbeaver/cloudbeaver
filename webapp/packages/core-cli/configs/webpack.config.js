const { resolve } = require('path');
const PnpWebpackPlugin = require('pnp-webpack-plugin');
const ModuleDependencyWarning = require('webpack/lib/ModuleDependencyWarning');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const threadLoader = require('thread-loader');
const ReactRefreshPlugin = require('@pmmmwh/react-refresh-webpack-plugin');

const excludedFromVendor = require('./excludedFromVendor.js');
// const ESLintPlugin = require('eslint-webpack-plugin');

class IgnoreNotFoundExportPlugin {
  apply(compiler) {
    const messageRegExp = /export '.*'( \(imported as '.*'\))? was not found in/;
    function doneHook(stats) {
      stats.compilation.warnings = stats.compilation.warnings.filter(warn => {
        if (warn instanceof ModuleDependencyWarning && messageRegExp.test(warn.message)) {
          return false;
        }
        return true;
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

threadLoader.warmup({}, ['babel-loader', 'css-loader', 'sass-loader', 'postcss-loader', 'style-loader', 'json5-loader', MiniCssExtractPlugin.loader]);

module.exports = (env, argv) => {
  process.env.NODE_ENV = argv.mode;
  const devTool = 'source-map' in env && 'source-map';
  const devMode = argv.mode !== 'production';
  function getBaseStyleLoaders() {
    const loaders = [];

    // Broke styles order in dev mode
    // if (devMode) {
    //  loaders.push('style-loader');
    // } else {
    loaders.push(MiniCssExtractPlugin.loader);
    // }

    return loaders;
  }

  function generateStyleLoaders(options = { hasModule: false, disable: false, pure: false }) {
    const moduleScope = options.hasModule ? 'local' : 'global';
    let modules = {
      mode: moduleScope,
      localIdentName: '[local]___[hash:base64:5]',
    };

    if (options.disable) {
      modules = false;
    }

    const postCssPlugins = [require('postcss-preset-env')({ stage: 0 })];

    if (!options.pure) {
      postCssPlugins.push(require('@reshadow/postcss')({ scopeBehaviour: moduleScope }));
    }

    return [
      ...getBaseStyleLoaders(),
      {
        loader: 'css-loader',
        options: {
          modules: modules,
          sourceMap: devMode,
        },
      },
      {
        loader: 'postcss-loader',
        options: {
          sourceMap: devMode,
          postcssOptions: {
            plugins: postCssPlugins,
            sourceMap: devMode,
          },
        },
      },
      {
        loader: 'sass-loader',
        options: {
          sourceMap: devMode,
          sassOptions: {
            implementation: require('sass'),
            includePaths: nodeModules,
            quietDeps: true,
          },
        },
      },
    ];
  }

  var babelLoader = {
    loader: require.resolve('babel-loader'),
    options: {
      plugins: [devMode && require.resolve('react-refresh/babel')].filter(Boolean),
      root: __dirname,
      cacheDirectory: true,
    },
  };

  return {
    // target: !devMode ? "web" : "browserslist",
    optimization: {
      runtimeChunk: 'single',
      moduleIds: 'deterministic',
      usedExports: true,
      sideEffects: true,
      concatenateModules: true,
      removeAvailableModules: false,
      removeEmptyChunks: false,
      splitChunks: {
        chunks: 'async',
        minSize: 20000,
        minRemainingSize: 0,
        minChunks: 1,
        maxAsyncRequests: 30,
        maxInitialRequests: 30,
        enforceSizeThreshold: 50000,
        cacheGroups: {
          locale: {
            test: /[\\/]locales[\\/].*?\.ts/,
            filename: '[name].[contenthash].js',
            name(module) {
              return module.rawRequest.substr(2);
            },
            priority: -5,
            reuseExistingChunk: true,
          },
          packages: {
            test: /[\\/]packages[\\/]((plugin|core)-.*?)[\\/]src[\\/]/,
            filename: '[name].[contenthash].js',
            name(module) {
              const path = module.context ?? module.resource;
              const match = /[\\/]packages[\\/]((plugin|core)-.*?)([\\/]|$)/.exec(path);
              if (!path || !match) {
                return 'package';
              }
              return match[1];
            },
            priority: -10,
            enforce: true,
          },
          defaultVendors: {
            chunks: 'all',
            name: 'vendors',
            test: new RegExp(`[\\\\/]node_modules[\\\\/](?!${excludedFromVendor.join('|')}).*?[\\\\/]`, ''),
            priority: -20,
            reuseExistingChunk: true,
          },
          default: {
            minChunks: 2,
            priority: -40,
            reuseExistingChunk: true,
          },
          // styles: {
          //   name: 'styles',
          //   type: 'css/mini-extract',
          //   chunks: 'all',
          //   enforce: true,
          // },
        },
      },
    },
    output: {
      pathinfo: false,
    },
    resolve: {
      extensions: ['.ts', '.tsx', '.js'],
      modules: nodeModules,
      // alias: {
      // "react/jsx-dev-runtime": "react/jsx-dev-runtime.js", // 17->18
      // "react/jsx-runtime": "react/jsx-runtime.js",
      // "react/jsx-runtime.js": "react/jsx-runtime", // 18->17
      // "react/jsx-dev-runtime.js": "react/jsx-dev-runtime"
      // },
      fallback: {
        // path: require.resolve('path-browserify'),
      },
      plugins: [PnpWebpackPlugin],
    },
    resolveLoader: {
      modules: nodeModules,
      plugins: [PnpWebpackPlugin.moduleLoader(module)],
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
          use: ['thread-loader', babelLoader],
        },
        {
          test: /\.(css|s[ac]ss)$/,
          exclude: /node_modules/,
          oneOf: [
            {
              test: /\.module\.(css|s[ac]ss)$/,
              use: generateStyleLoaders({ hasModule: true }),
            },
            {
              test: /\.m\.(css|s[ac]ss)$/,
              use: generateStyleLoaders({ hasModule: true, pure: true }),
            },
            {
              include: /node_modules/,
              use: [...getBaseStyleLoaders(), 'css-loader', 'sass-loader'],
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
      devMode && new ReactRefreshPlugin(),
      new ForkTsCheckerWebpackPlugin({
        typescript: {
          configOverwrite: {
            include: ['**/src/**/*.ts', '**/src/**/*.tsx'],
          },
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
        filename: devMode ? 'styles/[name].css' : 'styles/[name].[contenthash].css',
        chunkFilename: devMode ? 'styles/[name].bundle.css' : 'styles/[name].[contenthash].css',
        ignoreOrder: false, // Enable to remove warnings about conflicting order
        insert: linkTag => {
          let reshadowObj = document.getElementById('__reshadow__');

          if (reshadowObj) {
            document.head.insertBefore(linkTag, reshadowObj);
          } else {
            document.head.appendChild(linkTag);
          }
        },
      }),
    ],
  };
};
