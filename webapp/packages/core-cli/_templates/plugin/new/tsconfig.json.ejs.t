---
to: <%= name %>/tsconfig.json
---
<% isEE = cwd.includes('cloudbeaver-ee'); %>
{
  "extends": "@cloudbeaver/tsconfig/tsconfig.json",
  "compilerOptions": {
    "rootDir": "src",
    "outDir": "lib",
    "tsBuildInfoFile": "lib/tsconfig.tsbuildinfo",
    "composite": true
  },
  "references": [
    {
      "path": "<%= isEE ? '../../../../cloudbeaver/webapp/common-typescript/@dbeaver/cli' : '../../common-typescript/@dbeaver/cli' %>"
    },
    {
      "path": "../core-cli"
    },
    {
      "path": "../core-di"
    },
    {
      "path": "../core-di/tsconfig.json"
    }
  ],
  "include": [
    "__custom_mocks__/**/*",
    "src/**/*",
    "src/**/*.json",
    "src/**/*.css",
    "src/**/*.scss"
  ],
  "exclude": [
    "**/node_modules",
    "lib/**/*"
  ]
}
