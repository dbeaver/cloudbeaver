module.exports = {
  presets: [
    '@babel/preset-react',
  ],
  plugins: [
    '@babel/plugin-external-helpers',
    '@babel/plugin-syntax-dynamic-import',
    'react-require',
    'reshadow/babel',
  ],
}
