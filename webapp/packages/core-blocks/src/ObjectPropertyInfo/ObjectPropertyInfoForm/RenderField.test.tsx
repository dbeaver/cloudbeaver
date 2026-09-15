/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observable } from 'mobx';
import { describe, expect, it, vi } from 'vitest';

import { type IObjectPropertyInfo, ObjectPropertyLength } from '@cloudbeaver/core-sdk';
import { renderInApp } from '@cloudbeaver/tests-runner';

import { ObjectPropertyInfoForm } from './ObjectPropertyInfoForm.js';

vi.mock('../../localization/useTranslate.js', () => ({
  useTranslate: () => (key: string) => key,
}));

const property: IObjectPropertyInfo = {
  id: 'divider',
  displayName: 'Key group divider',
  dataType: 'String',
  defaultValue: ':',
  validValues: [':', '.', '/'],
  allowCustomValue: true,
  length: ObjectPropertyLength.Short,
  features: [],
  order: 0,
  required: false,
};

describe('ObjectPropertyInfoForm', () => {
  it('allows entering a custom value suggested by property metadata', async () => {
    const state = observable({ divider: ':' });
    const { findByRole, getByRole, user } = renderInApp(<ObjectPropertyInfoForm properties={[property]} state={state} />);
    const combobox = getByRole('combobox', { name: 'Key group divider' });

    await user.clear(combobox);
    await user.type(combobox, '::');

    expect(state.divider).toBe('::');
    expect(combobox).toHaveValue('::');

    await user.click(await findByRole('option', { name: '.' }));

    expect(state.divider).toBe('.');
    expect(combobox).toHaveValue('.');
  });

  it('does not allow entering a custom value for strict metadata', async () => {
    const state = observable({ divider: ':' });
    const { getByRole, user } = renderInApp(
      <ObjectPropertyInfoForm properties={[{ ...property, allowCustomValue: false }]} state={state} />,
    );
    const selector = getByRole('combobox', { name: 'Key group divider' });

    await user.type(selector, '::');

    expect(state.divider).toBe(':');
  });
});
