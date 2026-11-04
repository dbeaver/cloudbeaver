/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { RuleTester } from 'eslint';
import parser from '@typescript-eslint/parser';

import plugin from './plugin.js';
import rule from './packageBoundaries.js';

RuleTester.describe = describe;
RuleTester.it = it;

const ruleTester = new RuleTester({ languageOptions: { parser } });
const coreFilename = '/workspace/webapp/packages/core-example/src/index.ts';
const pluginFilename = '/workspace/webapp/packages/plugin-example/src/index.ts';
const administrationFilename = '/workspace/webapp/packages/plugin-example-administration/src/index.ts';
const pluginSetFilename = '/workspace/webapp/packages/plugin-set-common/src/index.ts';

ruleTester.run('package-boundaries', rule, {
  valid: [
    { filename: coreFilename, code: "import { value } from '@cloudbeaver/core-other';" },
    { filename: coreFilename, code: "export * from '@cloudbeaver/core-other';" },
    { filename: coreFilename, code: "import { value } from './local.js';" },
    { filename: coreFilename, code: "import { value } from '../../core-other/src/index.js';" },
    { filename: coreFilename, code: "import { value } from '@external/plugin-example';" },
    { filename: coreFilename, code: "import { value } from '@cloudbeaver/pluginish';" },
    { filename: coreFilename, code: 'export { value }; const value = 1;' },
    { filename: coreFilename, code: 'import(moduleName);' },
    { filename: coreFilename, code: 'import(`@cloudbeaver/plugin-${name}`);' },
    { filename: coreFilename, code: "function load(require) { return require('@cloudbeaver/plugin-other'); }" },
    { filename: pluginFilename, code: "import { value } from '@cloudbeaver/core-other';" },
    { filename: pluginFilename, code: "import { value } from '@cloudbeaver/plugin-other';" },
    { filename: pluginFilename, code: "import { value } from '@cloudbeaver/plugin-administration-tools';" },
    { filename: pluginFilename, code: "import { value } from './local.js';" },
    { filename: administrationFilename, code: "import { value } from '@cloudbeaver/plugin-other-administration';" },
    { filename: administrationFilename, code: "import { value } from '@cloudbeaver/plugin-other';" },
    { filename: administrationFilename, code: "import { value } from './local.js';" },
    { filename: pluginSetFilename, code: "import '@cloudbeaver/plugin-administration/module';" },
    { filename: pluginSetFilename, code: "import '@cloudbeaver/plugin-other-administration/module';" },
    { filename: pluginSetFilename, code: "export * from '@cloudbeaver/plugin-other-administration';" },
    { filename: pluginSetFilename, code: "import('../../plugin-other-administration/src/index.js');" },
    {
      filename: '/workspace/webapp/packages/plugin-set-custom/src/index.ts',
      code: "import '@cloudbeaver/plugin-other-administration';",
    },
    {
      filename: '/workspace/webapp/packages/product-example/src/index.ts',
      code: "import '@cloudbeaver/plugin-other-administration';",
    },
    { filename: '/workspace/script.ts', code: "import '@cloudbeaver/plugin-other';" },
    { code: "import '@cloudbeaver/plugin-other';" },
  ],
  invalid: [
    ...[
      "import { value } from '@cloudbeaver/plugin-other';",
      "import '@cloudbeaver/plugin-other';",
      "import type { Value } from '@cloudbeaver/plugin-other';",
      "export { value } from '@cloudbeaver/plugin-other';",
      "export * from '@cloudbeaver/plugin-other';",
      "export type { Value } from '@cloudbeaver/plugin-other';",
      "export type * from '@cloudbeaver/plugin-other';",
      "import('@cloudbeaver/plugin-other');",
      'import(`@cloudbeaver/plugin-other`);',
      "type Value = import('@cloudbeaver/plugin-other').Value;",
      "import other = require('@cloudbeaver/plugin-other');",
      "const other = require('@cloudbeaver/plugin-other');",
      "import '@cloudbeaver/plugin-other/subpath';",
      "import '@cloudbeaver/plugin-other?raw';",
      "import '../../plugin-other/src/index.js';",
      "import '/workspace/webapp/packages/plugin-other/src/index.js';",
    ].map(code => ({
      filename: coreFilename,
      code,
      output: null,
      errors: [{ messageId: 'coreToPlugin', data: { importer: 'core-example', target: 'plugin-other' } }],
    })),
    {
      filename: coreFilename,
      code: "import '@cloudbeaver/plugin-other-administration';",
      errors: [{ messageId: 'coreToPlugin', data: { importer: 'core-example', target: 'plugin-other-administration' } }],
    },
    {
      filename: coreFilename,
      code: "import '@cloudbeaver/plugin-set-common';",
      errors: [{ messageId: 'coreToPlugin', data: { importer: 'core-example', target: 'plugin-set-common' } }],
    },
    ...[
      "import { value } from '@cloudbeaver/plugin-other-administration';",
      "import type { Value } from '@cloudbeaver/plugin-other-administration';",
      "export * from '@cloudbeaver/plugin-other-administration';",
      "import('@cloudbeaver/plugin-other-administration');",
      "type Value = import('@cloudbeaver/plugin-other-administration').Value;",
      "const other = require('@cloudbeaver/plugin-other-administration');",
      "import '@cloudbeaver/plugin-other-administration/subpath';",
      "import '../../plugin-other-administration/src/index.js';",
    ].map(code => ({
      filename: pluginFilename,
      code,
      output: null,
      errors: [{ messageId: 'publicToAdministration', data: { importer: 'plugin-example', target: 'plugin-other-administration' } }],
    })),
    {
      filename: 'C:\\workspace\\webapp\\packages\\core-example\\src\\index.ts',
      code: "import '../../plugin-other/src/index.js';",
      errors: [{ messageId: 'coreToPlugin', data: { importer: 'core-example', target: 'plugin-other' } }],
    },
  ],
});

it('registers package-boundaries as a recommended error', () => {
  assert.equal(plugin.rules['package-boundaries'], rule);
  assert.equal(plugin.configs.recommended.rules['@cloudbeaver/package-boundaries'], 'error');
});
