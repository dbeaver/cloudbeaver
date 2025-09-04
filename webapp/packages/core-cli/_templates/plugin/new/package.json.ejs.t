---
to: <%= name %>/package.json
---
{
  "name": "@cloudbeaver/<%= name %>",
  "type": "module",
  "sideEffects": [
    "./lib/module.js",
    "./lib/index.js",
    "src/**/*.css",
    "src/**/*.scss",
    "public/**/*"
  ],
  "version": "0.1.0",
  "description": "",
  "license": "Apache-2.0",
  "exports": {
    ".": "./lib/index.js"
  },
  "scripts": {
    "build": "tsc -b",
    "clean": "rimraf --glob lib",
    "lint": "eslint ./src/ --ext .ts,.tsx",
    "test": "dbeaver-test",
    "validate-dependencies": "core-cli-validate-dependencies"
  },
  "dependencies": {
    "@cloudbeaver/core-di": "workspace:*"
  },
  "peerDependencies": {},
  "devDependencies": {
    "@cloudbeaver/core-cli": "workspace:*",
    "@cloudbeaver/tsconfig": "workspace:*",
    "@dbeaver/cli": "workspace:*",
    "rimraf": "^6",
    "typescript": "^5",
    "tslib": "^2"
  }
}