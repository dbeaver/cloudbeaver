/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { describe, expect, it, vi } from 'vitest';

import { ToolsPanel } from '@cloudbeaver/core-blocks';
import { type IMenuData, MenuActionItem, MenuBaseItem } from '@cloudbeaver/core-view';
import { renderInApp } from '@cloudbeaver/tests-runner';

import { UsersAdministrationToolsActions } from './UsersAdministrationToolsPanel.js';

function renderActions(...items: Array<MenuActionItem | MenuBaseItem>) {
  const menu = { items, context: { get: vi.fn() } } as unknown as IMenuData;
  const result = renderInApp(
    <ToolsPanel role="toolbar" aria-label="Users">
      <UsersAdministrationToolsActions menu={menu} translate={token => token} />
    </ToolsPanel>,
  );

  return { ...result, menu };
}

describe('UsersAdministrationToolsActions', () => {
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

    const { getByRole, user, menu } = renderActions(action, importItem);
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
    expect(onImport).toHaveBeenCalledWith(menu.context);
  });

  it('hides unavailable actions and disables actions according to the menu', () => {
    const hidden = new MenuActionItem({
      action: { id: 'hidden' },
      actionInfo: { label: 'Hidden' },
      isHidden: () => true,
      isDisabled: () => false,
    } as unknown as ConstructorParameters<typeof MenuActionItem>[0]);
    const disabled = new MenuBaseItem({ id: 'disabled', label: 'Disabled', disabled: true });

    const { queryByRole, getByRole } = renderActions(hidden, disabled);

    expect(queryByRole('button', { name: 'Hidden' })).toBeNull();
    expect(getByRole('button', { name: 'Disabled' })).toBeDisabled();
  });
});
