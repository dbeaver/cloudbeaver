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
import rule from './oneComponentPerFile.js';

RuleTester.describe = describe;
RuleTester.it = it;

const ruleTester = new RuleTester({
  languageOptions: { parser, parserOptions: { ecmaFeatures: { jsx: true } } },
});

function error(name) {
  return { messageId: 'multipleComponents', data: { name } };
}

ruleTester.run('one-component-per-file', rule, {
  valid: [
    '',
    'export { First, Second } from "./components.js";',
    'function First() { return <div />; }',
    'function First() { return null; }',
    'function First() { return <></>; }',
    'function First() { return [<div key="first" />, <span key="second" />]; }',
    'const First = observer(() => <div />);',
    'const First = observer(memo(forwardRef((props, ref) => <div ref={ref} />)));',
    'const First = React.memo(React.forwardRef((props, ref) => <div ref={ref} />));',
    'const First = observer(function First() { return <div />; });',
    'function First() { return <div />; } export default observer(First);',
    'function ComponentRender() { return <div />; } export const Component = observer(ComponentRender);',
    'function First() { return <div />; } const Alias = memo(First); export { Alias };',
    'export default observer(memo(() => <div />));',
    'export default function () { return <div />; }',
    'function First() { return <List renderItem={item => <span>{item}</span>} />; }',
    'function First() { return items.map(item => <span>{item}</span>); }',
    'function First() { function renderItem(item) { return <span>{item}</span>; } return <List renderItem={renderItem} />; }',
    'const First = () => <div />; function Helper() { return 42; }',
    'const First = () => <div />; function Helper() { return function renderItem() { return <span />; }; }',
    'const First = () => <div />; const Items = values.map(value => <span>{value}</span>);',
    'class First extends React.Component { render() { return <div />; } }',
    'const First = () => <div />; class Helper { render() { return <span />; } }',
    { filename: 'Example.tsx', code: 'const First = (observer(() => <div />) satisfies React.FC<Props>);' },
    { filename: 'Example.tsx', code: 'const First: React.FC<Props> = observer(() => <div />);' },
    ...['Example.test.tsx', 'Example.spec.tsx', 'Example.stories.tsx', 'Example.test.jsx', 'Example.test.ts'].map(filename => ({
      filename,
      code: 'const First = () => null; const Second = () => null;',
    })),
  ],
  invalid: [
    ...[
      'function First() { return <div />; } function Second() { return <span />; }',
      'const First = () => <div />; const Second = () => <span />;',
      'const First = function () { return <div />; }; const Second = function () { return <span />; };',
      'const First = observer(() => <div />); const Second = observer(() => <span />);',
      'const First = observer(() => null); const Second = observer(() => null);',
      'const First = observer(memo(() => <div />)); const Second = memo(forwardRef((props, ref) => <span ref={ref} />));',
      'const First = React.memo(() => <div />); const Second = React.forwardRef((props, ref) => <span ref={ref} />);',
      'import { observer as observe } from "mobx-react-lite"; const First = observe(() => null); const Second = observe(() => null);',
      'import { memo as cache, forwardRef as forward } from "react"; const First = cache(() => null); const Second = forward(() => null);',
      'import * as mobx from "mobx-react-lite"; const First = mobx.observer(() => null); const Second = mobx.observer(() => null);',
      'import R from "react"; const First = R.memo(() => null); const Second = R.forwardRef(() => null);',
      'import { createElement as element } from "react"; const First = () => element("div"); const Second = () => element("span");',
      'function First() { return React.createElement("div"); } function Second() { return React.createElement("span"); }',
      'function First() { return null; } function Second() { return null; }',
      'function First() { return ready ? <div /> : null; } function Second() { return ready && <span />; }',
      'function First() { if (ready) { return <div />; } } function Second() { return <span />; }',
      'class First extends React.Component { render() { return <div />; } } class Second extends React.PureComponent { render() { return <span />; } }',
      'import { Component as Base } from "react"; class First extends Base {} class Second extends Base {}',
      'const First = class extends React.Component {}; const Second = class extends React.Component {};',
      'const First = () => <div />; const parts = { Second: () => <span /> };',
      'function First() { function Second() { return <span />; } return <Second />; }',
    ].map(code => ({ code, output: null, errors: [error('Second')] })),
    { code: 'const First = () => <div />; export default () => <span />;', errors: [error('default export')] },
    { code: 'const First = () => <div />; export default function Second() { return <span />; }', errors: [error('Second')] },
    {
      filename: 'Example.tsx',
      code: 'const First = observer(() => <div />) as React.FC<Props>; const Second = observer(() => <span />) satisfies React.FC<Props>;',
      errors: [error('Second')],
    },
    {
      code: 'const First = () => <div />; const Second = () => <span />; const Third = () => <p />;',
      errors: [error('Second'), error('Third')],
    },
  ],
});

it('registers one-component-per-file as a recommended error with composition guidance', () => {
  assert.equal(plugin.rules['one-component-per-file'], rule);
  assert.equal(plugin.configs.recommended.rules['@cloudbeaver/one-component-per-file'], 'error');
  assert.match(rule.meta.messages.multipleComponents, /component-composition/);
  assert.match(rule.meta.docs.url, /component-composition\/SKILL\.md$/);
});
