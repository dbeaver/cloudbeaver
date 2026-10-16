/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { renderInApp } from '@cloudbeaver/tests-runner';
import { MenuActionItem, MenuBaseItem } from '@cloudbeaver/core-view';

import { UsersAdministrationToolsPanel } from './UsersAdministrationToolsPanel.js';

const mocks = vi.hoisted(() => ({
  items: [] as Array<MenuActionItem | MenuBaseItem>,
  context: { get: vi.fn() },
}));

vi.mock('@cloudbeaver/core-blocks', async importOriginal => ({
  ...(await importOriginal<typeof import('@cloudbeaver/core-blocks')>()),
  useAutoLoad: vi.fn(),
  useTranslate: () => (key: string) => (key === 'authentication_administration_item_users' ? 'Users' : key),
}));

vi.mock('@cloudbeaver/core-data-context', async importOriginal => ({
  ...(await importOriginal<typeof import('@cloudbeaver/core-data-context')>()),
  useDataContext: () => mocks.context,
  useDataContextLink: vi.fn(),
}));

vi.mock('@cloudbeaver/core-view', async importOriginal => ({
  ...(await importOriginal<typeof import('@cloudbeaver/core-view')>()),
  useMenu: () => ({ items: mocks.items, context: mocks.context, loaders: [] }),
}));

describe('UsersAdministrationToolsPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.items = [];
  });

  it('renders CE actions and EE contributions as direct buttons in menu order', async () => {
    const activate = vi.fn();
    const onImport = vi.fn();
    const action = new MenuActionItem({
      action: { id: 'create' },
      actionInfo: { label: 'Create' },
      isHidden: () => false,
      isDisabled: () => false,
      isLoading: () => false,
      activate,
    } as unknown as ConstructorParameters<typeof MenuActionItem>[0]);
    const importItem = new MenuBaseItem({ id: 'import', label: 'Import' }, { onSelect: onImport });
    mocks.items = [action, importItem];

    const { getByRole, user } = renderInApp(<UsersAdministrationToolsPanel onUpdate={vi.fn()} />);
    const panel = getByRole('toolbar', { name: 'Users' });

    expect(Array.from(panel.children).map(child => child.textContent)).toEqual(['Create', 'Import']);
    expect(panel.querySelector('[role="menubar"], [role="menuitem"]')).toBeNull();

    await user.tab();
    expect(getByRole('button', { name: 'Create' })).toHaveFocus();
    await user.keyboard('{Enter}');
    await user.tab();
    expect(getByRole('button', { name: 'Import' })).toHaveFocus();
    await user.click(getByRole('button', { name: 'Import' }));

    expect(activate).toHaveBeenCalledOnce();
    expect(onImport).toHaveBeenCalledWith(mocks.context);
  });

  it('hides unavailable actions and disables actions according to the menu', () => {
    mocks.items = [
      new MenuActionItem({
        action: { id: 'hidden' },
        actionInfo: { label: 'Hidden' },
        isHidden: () => true,
        isDisabled: () => false,
      } as unknown as ConstructorParameters<typeof MenuActionItem>[0]),
      new MenuBaseItem({ id: 'disabled', label: 'Disabled', disabled: true }),
    ];

    const { queryByRole, getByRole } = renderInApp(<UsersAdministrationToolsPanel onUpdate={vi.fn()} />);

    expect(queryByRole('button', { name: 'Hidden' })).toBeNull();
    expect(getByRole('button', { name: 'Disabled' })).toBeDisabled();
  });
});
