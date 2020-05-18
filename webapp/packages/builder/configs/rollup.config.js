const babelPlugin = require('rollup-plugin-babel');
const path = require('path');
const postcssPlugin = require('rollup-plugin-postcss');
const nodeResolve = require('rollup-plugin-node-resolve');
const commonjs = require('rollup-plugin-commonjs');
const peerDepsExternal = require('rollup-plugin-peer-deps-external');
const includePaths = require('rollup-plugin-includepaths');
const typescriptPlugin = require('rollup-plugin-typescript2');

const includePathOptions = {
  include: {},
  paths: ['src'],
  external: [

  ],
  extensions: ['.ts', '.tsx', '.js']
};

const defaultBuilderOptions = {
  babelConfig: path.join(__dirname, './babel-rollup.config.js'),
  typescriptConfig: '', // tbd
}

function configBuilder(options = defaultBuilderOptions) {

  return  {
    input: 'src/index.ts',
    output: {
        dir: 'dist',
        format: 'esm',
        sourcemap: true,
      },
    external: [
      // externals beyond peer dependencies
    ],
    plugins: [
      includePaths(includePathOptions),
      nodeResolve(),
      commonjs({
        sourceMap: false,
      }),
      typescriptPlugin({
        tsconfig: 'tsconfig.build.json',
        useTsconfigDeclarationDir: true,
      }),
      babelPlugin({
        exclude: 'node_modules/**',
        extensions: ['.js', '.ts', '.tsx'],
        configFile: options.babelConfig,
      }),
      postcssPlugin({
        extract: false,
        // enable CSS modules for .module.css .module.scss files
        autoModules: true,
        // modules: {
        //   generateScopedName: "[local]___[hash:base64:5]"
        // },
        inject: true,
        use: {
          sass: {
            includePaths: ['node_modules', '../../node_modules'],
          }
        },
        // this option is added in dkrupenya/rollup-plugin-postcss#develop
        // todo to be converted to custom loader
        // firstPlugin: require('reshadow/postcss'),
        // firstPlugin: require('reshadow/postcss')({ scopeBehaviour: 'global' }),
        plugins: [
          require('postcss-preset-env')({ stage: 0 }),
          require('postcss-discard-comments'),
          // todo move 'reshadow/postcss' to custom loader to run it before postcss-loader
          require('reshadow/postcss'),
        ]
      }),
      peerDepsExternal(),
    ],
  };

}

module.exports = configBuilder(defaultBuilderOptions);
