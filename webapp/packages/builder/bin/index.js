#!/usr/bin/env node

const webpack = require('webpack');
const buildConfig = require('../configs/webpack/exp')
const devConfig = require('../configs/webpack/dev-exp')
const baseRollupConfig = require('../configs/rollup.config.js');
const rollup = require('rollup');
const path = require('path');

const currentDir = process.cwd();

const webpackArgv = {
  mode: 'production',
  pluginsList: '',
  currentDir: currentDir,
}

const packageJson = require(path.join(currentDir, 'package.json'));
const packageName = packageJson.name;


function createRollupConfig() {
  let modules = []
  try {
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
    moduleConfig.output = {
      dir: `dist${moduleDir}`,
      format: 'esm',
    };

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
  // build-plugin and serve-plugin use rollup
  .command(
    'build-plugin',
    'Build plugin',
    {},
    function (argv) {
      async function build() {
        const config = createRollupConfig()
        for (const moduleConfig of config) {
          console.log(`Building ${moduleConfig.output.dir}`);
          const bundle = await rollup.rollup(moduleConfig);
          await bundle.write(moduleConfig.output);
        }
      }

      build()
    }
  )
  .command(
    'serve-plugin',
    'Build and watch plugin',
    {},
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
    {},
    function (argv) {
      const configObject = buildConfig({}, webpackArgv)
      const compiler = webpack(configObject);

      compiler.run((err, stats) => {
        console.log(stats.compilation.errors)
      });
    }
  )
  // todo deprecated, just for test purposes
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
    function (argv) {
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
    function (argv) {
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
  .help()
  .argv
