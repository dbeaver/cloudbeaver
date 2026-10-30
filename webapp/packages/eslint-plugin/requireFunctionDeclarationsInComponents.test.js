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
import rule from './requireFunctionDeclarationsInComponents.js';

RuleTester.describe = describe;
RuleTester.it = it;

const ruleTester = new RuleTester({
  languageOptions: { parser, parserOptions: { ecmaFeatures: { jsx: true } } },
});

const filename = 'Component.tsx';
const error = { messageId: 'requireDeclaration', data: { name: 'handle', componentName: 'Component' } };

ruleTester.run('require-function-declarations-in-components', rule, {
  valid: [
    { filename, code: 'const handle = () => {};' },
    { filename, code: 'const Component = () => <div />;' },
    { filename, code: 'function Component() { function handle() {} }' },
    { filename, code: 'function helper() { const handle = () => {}; }' },
    { filename, code: 'function useComponent() { const handle = () => {}; }' },
    { filename, code: 'export default () => { const handle = () => {}; };' },
    { filename, code: 'function Component() { let handle = () => {}; var other = function () {}; }' },
    { filename, code: 'function Component() { const handle = useCallback(() => {}, []); }' },
    { filename, code: 'function Component() { function helper() { const handle = () => {}; } }' },
    { filename, code: 'function Component() { useEffect(() => { const handle = () => {}; }); }' },
    { filename, code: 'function Component() { const { handle } = handlers; const empty = null; }' },
    ...['Component.ts', 'Component.jsx', 'Component.generated.tsx', 'Component.gen.tsx'].map(filename => ({
      filename,
      code: 'function Component() { const handle = () => {}; }',
    })),
  ],
  invalid: [
    ...[
      ['function Component() {', '}'],
      ['export default function Component() {', '}'],
      ['const Component = () => {', '};'],
      ['const Component = function () {', '};'],
      ['const Component = memo(() => {', '});'],
      ['const Component = observer(forwardRef((props, ref) => {', '}));'],
      ['const Component = React.memo(() => {', '});'],
    ].map(([start, end]) => ({
      filename,
      code: `${start} const handle = () => {}; ${end}`,
      output: `${start} function handle() {} ${end}`,
      errors: [error],
    })),
    {
      filename,
      code: 'function Component() { const handle = function () { save(); }; }',
      output: 'function Component() { function handle() { save(); } }',
      errors: [error],
    },
    {
      filename,
      code: 'function Component() { const handle = function handle() { handle(); }; }',
      output: 'function Component() { function handle() { handle(); } }',
      errors: [error],
    },
    {
      filename,
      code: 'function Component() { const handle = () => ({ ready: true }); }',
      output: 'function Component() { function handle() {\n  return { ready: true };\n} }',
      errors: [error],
    },
    {
      filename,
      code: 'function Component() {\n  const handle = value => value + 1;\n}',
      output: 'function Component() {\n  function handle(value) {\n    return value + 1;\n  }\n}',
      errors: [error],
    },
    {
      filename,
      code: 'function Component() { const handle = () => <button />; }',
      output: 'function Component() { function handle() {\n  return <button />;\n} }',
      errors: [error],
    },
    {
      filename,
      code: 'function Component() { const handle = async <T,>(value: T, ...rest: T[]): Promise<T> => value; }',
      output: 'function Component() { async function handle<T,>(value: T, ...rest: T[]): Promise<T> {\n  return value;\n} }',
      errors: [error],
    },
    {
      filename,
      code: 'function Component() { const handle = async function <T>(value: T): Promise<T> { return value; }; }',
      output: 'function Component() { async function handle<T>(value: T): Promise<T> { return value; } }',
      errors: [error],
    },
    {
      filename,
      code: 'function Component() { const handle = ({ value }: Props = { value: 1 }, ...rest: number[]): number => value + rest.length; }',
      output:
        'function Component() { function handle({ value }: Props = { value: 1 }, ...rest: number[]): number {\n  return value + rest.length;\n} }',
      errors: [error],
    },
    {
      filename,
      code: 'function Component() {\r\n  const handle = () => true;\r\n}',
      output: 'function Component() {\r\n  function handle() {\r\n    return true;\r\n  }\r\n}',
      errors: [error],
    },
    {
      filename,
      code: 'function Component() {\n  // Save the current value.\n  const handle = () => { /* Keep this comment. */ save(); };\n}',
      output: 'function Component() {\n  // Save the current value.\n  function handle() { /* Keep this comment. */ save(); }\n}',
      errors: [error],
    },
    {
      filename,
      code: 'function Component() { const handle = () => function () { return this; }; }',
      output: 'function Component() { function handle() {\n  return function () { return this; };\n} }',
      errors: [error],
    },
    ...[
      'const handle: () => void = () => {};',
      'const handle = () => {}, value = 1;',
      'const handle = function* () { yield 1; };',
      'const handle = function recursive() { return recursive(); };',
      'const handle = () => this.value;',
      'const handle = () => arguments[0];',
      'const handle = () => () => this.value;',
      'const handle = () => new.target;',
      'const /* Keep this comment. */ handle = () => {};',
      'const handle = (/* Keep parameter context. */ value) => value;',
      'const handle = () => /* Keep return context. */ value;',
      'const handle = () => {} /* Keep trailing context. */;',
      'for (const handle = () => true; handle();) {}',
    ].map(statement => ({
      filename,
      code: `function Component() { ${statement} }`,
      output: null,
      errors: [error],
    })),
  ],
});

it('registers require-function-declarations-in-components as a recommended error', () => {
  const name = 'require-function-declarations-in-components';
  assert.equal(plugin.rules[name], rule);
  assert.equal(plugin.configs.recommended.rules[`@cloudbeaver/${name}`], 'error');
});
