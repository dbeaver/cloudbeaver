#!/usr/bin/env node
/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

const webpack = require('webpack');
const buildConfig = require('../configs/webpack-build-config');
const devConfig = require('../configs/webpack-serve-config');
const baseRollupConfig = require('../configs/rollup.config.js');
const rollup = require('rollup');
const path = require('path');

const currentDir = process.cwd();


function createWebpackArgv(argv) {

  const fullPath = path.resolve(currentDir, argv.pluginsList || './plugins-list')
  let pluginsList = [];
  try {
    pluginsList = require(fullPath);
  } catch (e) {
    console.log('Plugins list is not found: ', fullPath);
  }

  // add mandatory plugin
  pluginsList = pluginsList.filter(plugin => plugin !== '@dbeaver/core');
  pluginsList.unshift('@dbeaver/core')

  const webpackArgv = {
    mode: argv.mode,
    pluginsList: pluginsList,

    currentDir: currentDir,
  }
  return webpackArgv;

}

const packageJson = require(path.join(currentDir, 'package.json'));
const packageName = packageJson.name;


function createRollupConfig() {
  let modules = []
  try {
    // required if you build plugin with several modules, for example, see @dbeaver/core
    modules = require(path.join(currentDir, 'modules.js'));
  } catch {
  }

  if (!modules.length) {
    return [baseRollupConfig];
  }

  return modules.map(module => {

    moduleDir = module ? `/${module}` : ''; // don't add slash for root module
    const moduleConfig = {...baseRollupConfig};
    moduleConfig.input = `src${moduleDir}/index.ts`;
    moduleConfig.output = {...baseRollupConfig.output};
    moduleConfig.output.dir = `dist${moduleDir}`;

    moduleConfig.external = [
      ...baseRollupConfig.external,
      ...modules
        .filter(name => name !== module && name !== '')
        .map(name => {
          moduleDir = name ? `/${name}` : ''; // don't add slash for root module
          return `${packageName}${moduleDir}`;
        }),
    ];
    return moduleConfig;
  })

}

require('yargs')
  .options({
    'l': {
      alias: 'pluginsList',
      demandOption: false,
      default: '',
      describe: 'path to plugins list relative to product location',
      type: 'string'
    }
  })
  // build-plugin and serve-plugin use rollup
  .command(
    'build-plugin',
    'Build plugin',
    {},
    function (argv) {
      async function build() {
        const config = createRollupConfig()
        for (const moduleConfig of config) {
          console.log(`Building ${packageName} ${moduleConfig.output.dir}`);
          try {
            const bundle = await rollup.rollup(moduleConfig);
            await bundle.write(moduleConfig.output);
          } catch (e) {
            console.error(e)
            process.exitCode = 1;
          } finally {
            console.log(`Build finished ${packageName} ${moduleConfig.output.dir}`);
          }
        }
      }

      build()
    }
  )
  .command(
    'serve-plugin',
    'Build and watch plugin',
    function (argv) {
      const rollup = require('rollup');

      const watchOptions = createRollupConfig();
      watchOptions.watch = {
        buildDelay: 500,
      };
      const watcher = rollup.watch(watchOptions);

      watcher.on('event', event => {
        console.log(event.code, event.input)
      });

    }
  )
  // build-app and serve-app use webpack to build final application from plugins
  .command(
    'build-app',
    'Build application',
    {
      mode: {
        alias: 'm',
        default: 'production',
      },
    },
    function (argv) {
      const webpackArgv = createWebpackArgv(argv);
      // console.log(webpackArgv)
      const configObject = buildConfig({}, webpackArgv)
      const compiler = webpack(configObject);

      compiler.run((err, stats) => {
        console.log(stats.compilation.errors)
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
      },
      mode: {
        alias: 'm',
        default: 'development',
      },
    },
    function (argv) {
      const webpackArgv = createWebpackArgv(argv);
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
  .help().argv;
