---
to: <%= name %>/tsconfig.json
---
<% isEE = cwd.includes('cloudbeaver-ee'); %>
{
  "extends": "<%= isEE ? '../../../../cloudbeaver/webapp/tsconfig.base.json' : '../../tsconfig.base.json' %>",
  "compilerOptions": {
    "rootDir": "src",
    "outDir": "lib",
    "tsBuildInfoFile": "lib/tsconfig.tsbuildinfo",
    "composite": true,
  },
  "references": [
    {
      "path": "<%= isEE ? '../../../../cloudbeaver/webapp/packages/core-di/tsconfig.json' : '../core-di/tsconfig.json' %>"
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
