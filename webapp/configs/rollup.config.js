import babelPlugin from 'rollup-plugin-babel';
const path = require('path');
import postcssPlugin from 'rollup-plugin-postcss';
import nodeResolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import peerDepsExternal from 'rollup-plugin-peer-deps-external';
import includePaths from 'rollup-plugin-includepaths';
import typescriptPlugin from 'rollup-plugin-typescript2';

const includePathOptions = {
  include: {},
  paths: ['src'],
  external: [

  ],
  extensions: ['.ts', '.tsx', '.js']
};

export const defaultBuilderOptions = {
  babelConfig: path.join(__dirname, './babel-rollup.config.js'),
  typescriptConfig: '', // tbd
}

export function configBuilder(options = defaultBuilderOptions) {

  return  {
    input: 'src/index.ts',
    output: [
      {
        dir: 'dist',
        format: 'esm',
      },
    ],
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
        firstPlugin: require('reshadow/postcss'),
        plugins: [
          require('postcss-preset-env')({ stage: 0 }),
          // todo move 'reshadow/postcss' to custom loader to run it before postcss-loader
          // require('reshadow/postcss'),
        ]
      }),
      peerDepsExternal(),
    ],
  };

}

export default configBuilder(defaultBuilderOptions);
