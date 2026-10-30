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
import statementSpacing from './statementSpacing.js';

RuleTester.describe = describe;
RuleTester.it = it;

const ruleTester = new RuleTester({
  languageOptions: {
    parser,
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
});

const missingBlankLine = { messageId: 'missingBlankLine' };

ruleTester.run('statement-spacing', statementSpacing, {
  valid: [
    '',
    'initialize();',
    'const first = 1;\nconst second = 2;\nuse(first, second);',
    'function run() {\n  initialize();\n  return result;\n}',
    'function run() { initialize(); prepare(); return result; }',
    'initialize();\n\nif (ready) {}\n\nfinish();',
    'initialize();\n\n\nclass Example {}',
    'function run() {\n  initialize();\n  prepare();\n\n  return result;\n}',
    'const value = compute(\n  argument,\n);\n\nuse(value);',
    'const value = compute(\n  argument,\n);\n\n// Use the result.\nuse(value);',
    'const value = compute(\n  argument,\n); // Computed value.\n\nuse(value);',
    'import {\n  first,\n} from "first";\nimport second from "second";\nexport { first, second };\nexport * from "third";',
    'import first = require("first");\nimport second = require("second");\nexport = first;',
    'import { first } from "first";\nconst value = first;',
    ...['example.d.ts', 'example.generated.ts', 'example.gen.ts'].map(filename => ({
      filename,
      code: 'interface First {}\ninterface Second {}',
    })),
  ],
  invalid: [
    ...[
      'do {} while (ready);',
      'for (const key in values) {}',
      'for (const value of values) {}',
      'for (;;) {}',
      'if (ready) {}',
      'switch (value) {}',
      'try {} finally {}',
      'while (ready) {}',
      'class Example {}',
      'function run() {}',
      'enum Example {}',
      'interface Example {}',
      'namespace Example {}',
    ].map(statement => ({
      code: `initialize();\n${statement}\nfinish();`,
      output: `initialize();\n\n${statement}\n\nfinish();`,
      errors: [missingBlankLine, missingBlankLine],
    })),
    ...[
      'export class Example {}',
      'export default class Example {}',
      'export function run() {}',
      'export default function run() {}',
      'export enum Example {}',
      'export interface Example {}',
      'export namespace Example {}',
    ].map(statement => ({
      code: `initialize();\n${statement}\nfinish();`,
      output: `initialize();\n\n${statement}\n\nfinish();`,
      errors: [missingBlankLine, missingBlankLine],
    })),
    ...[
      ['function run() {\n', '\n}'],
      ['class Example { static {\n', '\n} }'],
      ['switch (value) { case 1:\n', '\n}'],
      ['namespace Example {\n', '\n}'],
    ].map(([start, end]) => ({
      code: `${start}const value = compute(\n  argument,\n);\nuse(value);${end}`,
      output: `${start}const value = compute(\n  argument,\n);\n\nuse(value);${end}`,
      errors: [missingBlankLine],
    })),
    {
      code: 'function run() {\n  initialize();\n  prepare();\n  return result;\n}',
      output: 'function run() {\n  initialize();\n  prepare();\n\n  return result;\n}',
      errors: [{ ...missingBlankLine, line: 4, column: 3 }],
    },
    {
      code: 'initialize();\nif (ready) return result;',
      output: 'initialize();\n\nif (ready) return result;',
      errors: [missingBlankLine],
    },
    {
      code: 'const value = compute(\n  argument,\n);\nuse(value);',
      output: 'const value = compute(\n  argument,\n);\n\nuse(value);',
      errors: [missingBlankLine],
    },
    {
      code: 'export const value = {\n  ready: true,\n};\nuse(value);',
      output: 'export const value = {\n  ready: true,\n};\n\nuse(value);',
      errors: [missingBlankLine],
    },
    {
      code: 'initialize();\n// A documented step.\n/* Additional context. */\nif (ready) {}',
      output: 'initialize();\n\n// A documented step.\n/* Additional context. */\nif (ready) {}',
      errors: [{ ...missingBlankLine, line: 2, column: 1 }],
    },
    {
      code: 'if (ready) {} // Previous step.\n// Next step.\nfinish();',
      output: 'if (ready) {} // Previous step.\n\n// Next step.\nfinish();',
      errors: [{ ...missingBlankLine, line: 2, column: 1 }],
    },
    {
      code: 'function run() {\r\n  initialize();\r\n  prepare();\r\n  return result;\r\n}',
      output: 'function run() {\r\n  initialize();\r\n  prepare();\r\n\r\n  return result;\r\n}',
      errors: [missingBlankLine],
    },
    {
      code: 'import {\n  first,\n} from "first";\nconst value = first;',
      output: 'import {\n  first,\n} from "first";\n\nconst value = first;',
      errors: [missingBlankLine],
    },
    {
      code: 'import {\n  first,\n} from "first";\nexport class Example {}',
      output: 'import {\n  first,\n} from "first";\n\nexport class Example {}',
      errors: [missingBlankLine],
    },
  ],
});

it('registers statement-spacing as a recommended error', () => {
  assert.equal(plugin.rules['statement-spacing'], statementSpacing);
  assert.equal(plugin.configs.recommended.rules['@cloudbeaver/statement-spacing'], 'error');
});
