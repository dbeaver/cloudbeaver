#!/usr/bin/env node

const webpack = require('webpack');
const buildConfig = require('../configs/webpack/exp')
const devConfig = require('../configs/webpack/dev-exp')
const rollupConfig = require('../configs/rollup.config.js');
const rollup = require('rollup');

const webpackArgv = {
  mode: 'production',
  pluginsList: '',
  currentDir: process.cwd()
}

require('yargs')
  .command(
    'build-app',
    'Build application',
    {},
    function(argv) {
      const configObject = buildConfig({}, webpackArgv)
      const compiler = webpack(configObject);

      compiler.run((err, stats) => {
        console.log(stats.compilation.errors)
      });
    }
  )
  .command(
    'build-plugin',
    'Build plugin',
    {},
    function(argv) {
      async function build() {
        const bundle = await rollup.rollup(rollupConfig);
        await bundle.write(rollupConfig.output);
      }
      build()
    }
  )
  .command(
    'serve-app-old',
    'Start webpack dev server for serving application',
    {
      server: {
        alias: 's',
        default: 'localhost:3100'
      },
      port: {
        alias: 'p',
        default: 3100
      }
    },
    function(argv) {
      console.log('Serve app old way')
      console.log(argv)
      webpackArgv.mode = 'development'
      webpackArgv.server = argv.server
      const devConfigOld = require('../configs/webpack/dev')
      const configObject = devConfigOld({}, webpackArgv)
      console.log(configObject.devServer)
      const WebpackDevServer = require('webpack-dev-server');
      const server = new WebpackDevServer(webpack(configObject), configObject.devServer);
      const port = argv.port

      server.listen(port, 'localhost', function (err) {
        if (err) {
          console.log(err);
        }
        console.log('WebpackDevServer listening at localhost:', port);
      });
    }
  )
  .command(
    'serve-app',
    'Start webpack dev server for serving application',
    {
      server: {
        alias: 's',
        default: 'localhost:3100'
      },
      port: {
        alias: 'p',
        default: 3100
      }
    },
    function(argv) {
      webpackArgv.mode = 'development'
      webpackArgv.server = argv.server
      const configObject = devConfig({}, webpackArgv)
      const WebpackDevServer = require('webpack-dev-server');
      const server = new WebpackDevServer(webpack(configObject), configObject.devServer);
      const port = argv.port

      server.listen(port, 'localhost', function (err) {
        if (err) {
          console.log(err);
        }
        console.log('WebpackDevServer listening at localhost:', port);
      });
    }
  )
  .command(
    'serve-plugin',
    'Build and watch plugin',
    {},
    function(argv) {
      const rollup = require('rollup');

      const watchOptions = rollupConfig;
      watchOptions.watch = {
        buildDelay: 500,
      };
      const watcher = rollup.watch(watchOptions);

      watcher.on('event', event => {
        console.log(event.code)
      });

    }
  )
  .help()
  .argv
