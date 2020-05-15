module.exports = {
  presets: [
    "@babel/preset-env",
    "@babel/preset-react",
    ['@babel/preset-typescript', { isTSX: true, allExtensions: true }],
  ],
  plugins: [
    '@babel/plugin-transform-runtime',
    '@babel/plugin-syntax-dynamic-import',
    'babel-plugin-transform-typescript-metadata',
    '@babel/plugin-proposal-optional-chaining',
    ['@babel/plugin-proposal-decorators', { legacy: true }],
    ['@babel/plugin-proposal-class-properties', { loose: true }],
    'react-require',
    'reshadow/babel',
  ],
}
