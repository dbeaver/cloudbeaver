/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Linter } from 'eslint';
import config from './flat.js';

function lint(code, filename = 'example.ts') {
  return new Linter().verify(code, config, { filename });
}

const namingExamples = [
  {
    name: 'exported interface without an I prefix',
    code: 'export interface ObjectPropertyFormProps { value: string; }',
    rule: '@typescript-eslint/naming-convention',
  },
  {
    name: 'short service variable',
    code: 'function useExample() { const service = useService(ExampleService); return service; }',
    rule: '@cloudbeaver/service-variable-name',
  },
  {
    name: 'short constructor dependency',
    code: 'class Example { constructor(private resource: ExampleResource) {} }',
    rule: '@cloudbeaver/service-variable-name',
  },
  {
    name: 'anonymous function without an inferred name',
    code: '(function () {})();',
    rule: 'func-names',
  },
];

for (const { name, code, rule } of namingExamples) {
  test(`reports ${name} without blocking lint`, () => {
    const messages = lint(code);
    assert.deepEqual(
      messages.filter(message => message.severity === 2),
      [],
    );
    assert.ok(messages.some(message => message.ruleId === rule && message.severity === 1));
  });
}

test('accepts an async handler with a name inferred from its property', () => {
  const messages = lint('const handlers = { onSubmit: async function () { await submit(); } };');
  assert.deepEqual(
    messages.filter(message => message.severity === 2 || message.ruleId === 'func-names'),
    [],
  );
});

test('accepts conventional interface and service names without naming warnings', () => {
  const messages = lint(`
    export interface IExampleProps { value: string; }
    function useExample() { const exampleService = useService(ExampleService); return exampleService; }
  `);
  assert.deepEqual(
    messages.filter(message => message.severity === 2 || namingExamples.some(example => example.rule === message.ruleId)),
    [],
  );
});

const blockingExamples = [
  {
    name: 'conditional hook calls',
    code: `
      import { useState } from 'react';
      export function Example({ enabled }) {
        if (enabled) { useState(0); }
        return null;
      }
    `,
    rule: 'react-hooks/rules-of-hooks',
  },
  {
    name: 'reading a ref during render',
    code: `
      import { useRef } from 'react';
      export function Example() {
        const ref = useRef(0);
        return <span>{ref.current}</span>;
      }
    `,
    rule: 'react-hooks/refs',
  },
  {
    name: 'synchronous component imports from TypeScript modules',
    code: "export { Widget } from 'example/Widget.tsx';",
    rule: '@cloudbeaver/no-sync-component-import',
    filename: 'example.ts',
  },
  {
    name: 'duplicate imports',
    code: "import { first } from 'example';\nimport { second } from 'example';",
    rule: 'no-duplicate-imports',
  },
];

for (const { name, code, rule, filename = 'example.tsx' } of blockingExamples) {
  test(`still blocks ${name}`, () => {
    const messages = lint(code, filename);
    assert.ok(
      messages.some(message => message.ruleId === rule && message.severity === 2),
      JSON.stringify(messages),
    );
  });
}
