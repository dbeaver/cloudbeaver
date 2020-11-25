const test = process.env.NODE_ENV === "test";
const prod = process.env.NODE_ENV === "production";
const { warn } = console;

// Prevents resolution warnings from babel-plugin-module-resolver
// See https://github.com/tleunen/babel-plugin-module-resolver/issues/315
// eslint-disable-next-line no-console
console.warn = (...args) => {
  for (const arg of args) {
    if (arg.startsWith("Could not resolve") && /src/.test(arg)) {
      return;
    }
  }
  warn(...args);
};

module.exports = {
  compact: prod,
  presets: [
    "@babel/preset-react",
    ['@babel/preset-typescript', { isTSX: true, allExtensions:true }],
    [
      "@babel/preset-env",
      {
        modules: false,
        targets: {
          browsers: [
            "last 1 chrome version",
            "last 1 firefox version",
            "last 1 edge version",
            "last 1 safari version"
          ]
        },
        exclude: ["transform-async-to-generator", "transform-regenerator"],
      }
    ],
  ],
  plugins: [
    '@babel/plugin-syntax-dynamic-import',
    'babel-plugin-transform-typescript-metadata',
    '@babel/plugin-proposal-nullish-coalescing-operator',
    '@babel/plugin-proposal-optional-chaining',
    ['@babel/plugin-proposal-decorators', { legacy: true }],
    ['@babel/plugin-proposal-class-properties', { loose: true }],
    ["@babel/plugin-proposal-object-rest-spread", { loose: true, useBuiltIns: true }],
    'react-require',
    'reshadow/babel',
    /*!prod &&*/[
      "babel-plugin-module-resolver",
      {
        alias: {
          "^@cloudbeaver([^/]*)(.*)$": "@cloudbeaver\\2\\1/src",
        },
      },
    ],
  ].filter(Boolean),
}
