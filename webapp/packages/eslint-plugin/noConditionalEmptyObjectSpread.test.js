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
import rule from './noConditionalEmptyObjectSpread.js';

RuleTester.describe = describe;
RuleTester.it = it;

const ruleTester = new RuleTester({
  languageOptions: { parser, parserOptions: { ecmaFeatures: { jsx: true } } },
});

const error = { messageId: 'conditionalEmptyObject', type: 'SpreadElement' };

ruleTester.run('no-conditional-empty-object-spread', rule, {
  valid: [
    'const options = {};',
    'const options = { ...properties };',
    'const options = { ...{} };',
    'const options = { ...(enabled ? { value } : { fallback }) };',
    'const options = { ...(enabled ? properties : defaults) };',
    'const options = { ...(enabled && { value }) };',
    'const options = { value: enabled ? value : {} };',
    'const options = enabled ? {} : { value };',
    'const options = { ...(enabled ? { ...properties } : defaults) };',
    'const values = [...(enabled ? {} : values)];',
    'call(...(enabled ? {} : values));',
    'new Constructor(...(enabled ? values : {}));',
    { filename: 'Component.tsx', code: 'const element = <Component {...(enabled ? { value } : {})} />;' },
  ],
  invalid: [
    ...[
      'const options = { ...(enabled ? { value } : {}) };',
      'const options = { ...(enabled ? {} : { value }) };',
      'const options = { ...(enabled ? {} : {}) };',
      'const options = { ...(enabled ? properties : {}) };',
      'const options = { ...(enabled ? {} : properties) };',
      'const options = { ...((enabled ? ({ value }) : ({}))) };',
      'const options = { ...(((enabled ? (({})) : ({ value })))) };',
      'const options = { ...(enabled ? { value } : { /* Omit the property. */ }) };',
      'const options = { nested: { ...(enabled ? { value } : {}) } };',
      'const options = { ...(enabled ? { ...properties } : {}) };',
    ].map(code => ({ code, output: null, errors: [error] })),
    {
      filename: 'options.ts',
      code: 'const options: Options = { ...(enabled ? { value } : {}) };',
      output: null,
      errors: [error],
    },
    {
      filename: 'Component.tsx',
      code: 'const element = <Component options={{ ...(enabled ? { value } : {}) }} />;',
      output: null,
      errors: [error],
    },
    {
      code: 'const options = { ...(first ? { value } : {}), ...(second ? {} : { other }) };',
      output: null,
      errors: [error, error],
    },
  ],
});

it('registers no-conditional-empty-object-spread as a recommended error', () => {
  const name = 'no-conditional-empty-object-spread';
  assert.equal(plugin.rules[name], rule);
  assert.equal(plugin.configs.recommended.rules[`@cloudbeaver/${name}`], 'error');
});
