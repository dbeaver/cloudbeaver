/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as coreBlocks from '@cloudbeaver/core-blocks';
import * as coreDI from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { LocalizationService } from '@cloudbeaver/core-localization';
import { ActionService, KeyBindingService, MenuService } from '@cloudbeaver/core-view';

import { TabList } from '../TabList.js';
import { TabsBootstrap } from '../TabsBootstrap.js';
import { TabsState, type TabsStateProps } from '../TabsState.js';
import { Tab } from './Tab.js';

function TestTabs(props: TabsStateProps) {
  return (
    <TabsState tabList={['first', 'second']} currentTabId="first" enabledBaseActions onClose={vi.fn()} {...props}>
      <TabList aria-label="Test tabs">
        <Tab tabId="first">First</Tab>
        <Tab tabId="second">Second</Tab>
      </TabList>
      {props.children}
    </TabsState>
  );
}

describe('Tab context menu', () => {
  beforeEach(() => {
    const actionService = new ActionService(new KeyBindingService());
    const menuService = new MenuService(actionService);
    const services = [new LocalizationService(), menuService];
    new TabsBootstrap(actionService, menuService).register();

    vi.spyOn(coreDI, 'useService').mockImplementation(service => {
      if (service === NotificationService) {
        return { logError: vi.fn() };
      }
      const instance = services.find(instance => typeof service === 'function' && instance instanceof service);
      if (instance) {
        return instance;
      }
      throw new Error('Unexpected service requested');
    });
    vi.spyOn(coreBlocks, 'useAutoLoad').mockImplementation(() => {});
    vi.stubGlobal('_ROOT_URI_', '/');
    vi.stubGlobal('_ICON_SPRITE_URI_', '/icons.svg');
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it.each([undefined, false])('preserves the browser context menu when enableContextMenu is %s', enableContextMenu => {
    render(<TestTabs enableContextMenu={enableContextMenu} />);

    expect(fireEvent.contextMenu(screen.getByRole('tab', { name: 'Second' }))).toBe(true);
    expect(screen.queryByRole('menu')).toBeNull();
  });

  it('opens the existing menu for the clicked tab without selecting it', async () => {
    const onClose = vi.fn();
    const onChange = vi.fn();
    render(<TestTabs enableContextMenu onClose={onClose} onChange={onChange} />);

    expect(fireEvent.contextMenu(screen.getByRole('tab', { name: 'Second' }), { clientX: 120, clientY: 40 })).toBe(false);
    const menu = await screen.findByRole('menu');
    expect(screen.getByRole('tab', { name: 'First' }).getAttribute('aria-selected')).toBe('true');
    expect(onChange).not.toHaveBeenCalled();

    fireEvent.click(within(menu).getByRole('menuitem', { name: 'ui_close' }));
    await waitFor(() => expect(onClose).toHaveBeenCalledWith(expect.objectContaining({ tabId: 'second' })));
  });

  it('does not enable context menus in nested tab groups', () => {
    render(
      <TestTabs enableContextMenu>
        <TabsState tabList={['result']} enabledBaseActions onClose={vi.fn()}>
          <TabList aria-label="SQL results">
            <Tab tabId="result">Result</Tab>
          </TabList>
        </TabsState>
      </TestTabs>,
    );

    expect(fireEvent.contextMenu(screen.getByRole('tab', { name: 'Result' }))).toBe(true);
    expect(screen.queryByRole('menu')).toBeNull();
  });

  it.each([undefined, true])('keeps the menu button working when enableContextMenu is %s', async enableContextMenu => {
    render(<TestTabs enableContextMenu={enableContextMenu} />);

    fireEvent.click(screen.getAllByRole('button', { name: 'Tab menu' })[0]!);

    expect(await screen.findByRole('menuitem', { name: 'ui_close' })).not.toBeNull();
  });

  it('closes the menu with Escape and allows opening it again for another tab', async () => {
    const onClose = vi.fn();
    render(<TestTabs enableContextMenu onClose={onClose} />);
    fireEvent.contextMenu(screen.getByRole('tab', { name: 'First' }), { clientX: 80, clientY: 40 });

    fireEvent.keyDown(await screen.findByRole('menu'), { key: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('menu')).toBeNull());

    fireEvent.contextMenu(screen.getByRole('tab', { name: 'Second' }), { clientX: 160, clientY: 40 });
    fireEvent.click(await screen.findByRole('menuitem', { name: 'ui_close' }));

    await waitFor(() => expect(onClose).toHaveBeenCalledWith(expect.objectContaining({ tabId: 'second' })));
  });

  it('preserves selection and closing with the middle mouse button', async () => {
    const onChange = vi.fn();
    const onClose = vi.fn();
    render(<TestTabs enableContextMenu onChange={onChange} onClose={onClose} />);
    const tab = screen.getByRole('tab', { name: 'Second' });

    fireEvent.click(tab);
    await waitFor(() => expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ tabId: 'second' })));
    fireEvent.mouseUp(tab, { button: 1 });
    await waitFor(() => expect(onClose).toHaveBeenCalledWith(expect.objectContaining({ tabId: 'second' })));
    expect(screen.queryByRole('menu')).toBeNull();
  });

  it('does not intercept context menu events on disabled tabs', () => {
    render(
      <TabsState tabList={['disabled']} enableContextMenu enabledBaseActions>
        <TabList>
          <Tab tabId="disabled" disabled>
            Disabled
          </Tab>
        </TabList>
      </TabsState>,
    );

    expect(fireEvent.contextMenu(screen.getByRole('tab', { name: 'Disabled' }))).toBe(true);
    expect(screen.queryByRole('menu')).toBeNull();
  });

  it('preserves tab reordering', () => {
    const onReorder = vi.fn();
    render(<TestTabs reorderStateKey="test-tabs" enableContextMenu onReorder={onReorder} />);
    const first = screen.getByRole('tab', { name: 'First' });
    const second = screen.getByRole('tab', { name: 'Second' });
    const dataTransfer = new DataTransfer();

    fireEvent.dragStart(first, { dataTransfer });
    fireEvent.dragOver(second, { dataTransfer, clientX: 100 });
    fireEvent.drop(second, { dataTransfer });
    fireEvent.dragEnd(first, { dataTransfer });

    expect(onReorder).toHaveBeenCalledWith('first', 'second', 'after');
    expect(screen.queryByRole('menu')).toBeNull();
  });
});
