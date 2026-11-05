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
import rule from './functionNameMatchesVariable.js';

RuleTester.describe = describe;
RuleTester.it = it;

const ruleTester = new RuleTester({
  languageOptions: { parser, parserOptions: { ecmaFeatures: { jsx: true } } },
});

const error = { messageId: 'nameMismatch', data: { functionName: 'Inner', variableName: 'Component' }, type: 'Identifier' };

ruleTester.run('function-name-matches-variable', rule, {
  valid: [
    'const Component = function Component() {};',
    'const Component = function () {};',
    'const Component = () => <div />;',
    'const Component = observer(function Component() { return <div />; });',
    'const Component = observer(memo(forwardRef(function Component() { return <div />; })));',
    'const Component = React.memo(React.forwardRef(function Component() { return <div />; }));',
    'const Component = observer(function () { return <div />; });',
    'const Component = observer(Render);',
    'function ComponentRender() { return <div />; } export const Component = observer(ComponentRender);',
    'const Component = ExistingComponent;',
    'const Component = useMemo(function createComponent() { return Render; }, []);',
    'const Component = items.map(function renderItem(item) { return <div>{item}</div>; });',
    'const Component = register("name", function callback() {});',
    'const options = { Component: function Inner() {} };',
    'const [Component] = [function Inner() {}];',
    'let Component = function Inner() {};',
    'var Component = function Inner() {};',
    'export default observer(function Component() { return <div />; });',
    'function Component() { return <div />; }',
    { filename: 'Component.tsx', code: 'const Component = observer<Props>(function Component() { return <div />; }) satisfies React.FC<Props>;' },
  ],
  invalid: [
    ...[
      'const Component = function Inner() {};',
      'export const Component = function Inner() {};',
      'const Component = async function Inner() {};',
      'const Component = function* Inner() { yield 1; };',
      'const Component = function Inner() { return Inner(); };',
      'const Component = observer(function Inner() { return <div />; });',
      'const Component = observer(function Inner() { return <Other component={Component} />; });',
      'const Component = memo(function Inner() { return <div />; });',
      'const Component = forwardRef(function Inner(props, ref) { return <div ref={ref} />; });',
      'const Component = observer(memo(forwardRef(function Inner() { return <div />; })));',
      'const Component = React.memo(React.forwardRef(function Inner() { return <div />; }));',
      'import { observer as observe } from "mobx-react-lite"; const Component = observe(function Inner() {});',
      'const Component = observe(function Inner() {}); import { observer as observe } from "mobx-react-lite";',
      'import { observer as observe } from "mobx-react"; const Component = observe(function Inner() {});',
      'import { memo as cache } from "react"; const Component = cache(function Inner() {});',
      'import R from "react"; const Component = R.memo(function Inner() {});',
      'import * as mobx from "mobx-react-lite"; const Component = mobx.observer(function Inner() {});',
    ].map(code => ({ code, output: null, errors: [error] })),
    ...[
      'const Component: React.FC<Props> = observer<Props>(function Inner() { return <div />; });',
      'const Component = observer(function Inner() { return <div />; } as React.FC);',
      'const Component = (observer(function Inner() { return <div />; }) as React.FC)!;',
      'const Component = observer(function Inner() { return <div />; }) satisfies React.FC;',
    ].map(code => ({ filename: 'Component.tsx', code, output: null, errors: [error] })),
    {
      code: 'const handler = function callback() {};',
      errors: [{ messageId: 'nameMismatch', data: { functionName: 'callback', variableName: 'handler' } }],
    },
    {
      code: 'const Component = function Inner() {}, Other = function Different() {};',
      errors: [error, { messageId: 'nameMismatch', data: { functionName: 'Different', variableName: 'Other' } }],
    },
  ],
});

it('registers function-name-matches-variable as a recommended error without an unsafe rename fix', () => {
  assert.equal(plugin.rules['function-name-matches-variable'], rule);
  assert.equal(plugin.configs.recommended.rules['@cloudbeaver/function-name-matches-variable'], 'error');
  assert.equal(rule.meta.fixable, undefined);
});
