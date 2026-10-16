/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { describe, expect, it, vi } from 'vitest';

import type { IMenuData, MenuActionItem, MenuBaseItem } from '@cloudbeaver/core-view';

import { getUsersAdministrationToolsActions } from './getUsersAdministrationToolsActions.js';

const translate = <T extends string | undefined>(token: T): T => token;
const context = { get: vi.fn() } as unknown as IMenuData['context'];

describe('getUsersAdministrationToolsActions', () => {
  it('keeps CE actions and EE contributions in order with their handlers', () => {
    const activate = vi.fn();
    const onImport = vi.fn();
    const create = {
      id: 'create',
      action: { actionInfo: { label: 'Create', tooltip: 'Create user', icon: 'add' }, activate, isLoading: () => false },
      disabled: false,
    } as unknown as MenuActionItem;
    const importItem = {
      id: 'import',
      label: 'Import',
      icon: 'add',
      disabled: false,
      events: { onSelect: onImport },
    } as unknown as MenuBaseItem;

    const actions = getUsersAdministrationToolsActions([create, importItem], context, translate);

    expect(actions.map(action => action.label)).toEqual(['Create', 'Import']);
    expect(actions[0]).toMatchObject({ title: 'Create user', icon: 'add', disabled: false });
    expect(actions[0]?.isLoading?.()).toBe(false);
    actions[0]?.onClick();
    actions[1]?.onClick();

    expect(activate).toHaveBeenCalledOnce();
    expect(onImport).toHaveBeenCalledWith(context);
  });

  it('omits hidden actions and preserves disabled state', () => {
    const hidden = { id: 'hidden', hidden: true } as MenuActionItem;
    const disabled = { id: 'disabled', label: 'Disabled', disabled: true } as MenuBaseItem;

    const actions = getUsersAdministrationToolsActions([hidden, disabled], context, translate);

    expect(actions).toHaveLength(1);
    expect(actions[0]).toMatchObject({ id: 'disabled', label: 'Disabled', disabled: true });
  });
});
