/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { DialogsPortal } from '@cloudbeaver/core-blocks';
import * as DI from '@cloudbeaver/core-di';
import { CommonDialogService, DialogueStateResult } from '@cloudbeaver/core-dialogs';
import { NotificationService } from '@cloudbeaver/core-events';
import { LocalizationService } from '@cloudbeaver/core-localization';

import { NodeDeletionDialog, type INodeDeletionDialogItem } from './NodeDeletionDialog.js';

const ITEM: INodeDeletionDialogItem = {
  id: 'connection',
  name: 'Connection',
  icon: '/icons/connection.svg',
  type: 'connection',
  project: 'Project',
  location: 'Folder',
};

describe('NodeDeletionDialog', () => {
  let root: Root;
  let container: HTMLDivElement;
  let dialogs: CommonDialogService;

  beforeEach(() => {
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
    vi.stubGlobal('_ROOT_URI_', '/');
    // Give the virtualized grid a viewport wide enough to render all columns.
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(1000);
    dialogs = new CommonDialogService();
    vi.spyOn(DI, 'useService').mockImplementation(token => {
      if (token === LocalizationService) {
        return {
          translate: (token: string, _defaultValue?: string, args?: Record<string, string | number>) =>
            [token, ...Object.values(args ?? {})].join(' '),
        } as LocalizationService;
      }
      if (token === CommonDialogService) {
        return dialogs;
      }
      if (token === NotificationService) {
        return { logSuccess: vi.fn(), logException: vi.fn() } as unknown as NotificationService;
      }
      throw new Error('Service not available in this dialog test');
    });
    container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(() => root.unmount());
    container.remove();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('shows a single node by name and type without a grid and cancels with Escape', async () => {
    const payload = { items: [ITEM] };
    const result = dialogs.open(NodeDeletionDialog, payload);

    await act(() => {
      root.render(<DialogsPortal />);
    });

    const dialog = document.querySelector('[role="dialog"]');
    expect(dialog?.getAttribute('aria-label')).toBe('ui_data_delete_confirmation');
    expect(dialog?.getAttribute('data-size')).toBe('small');
    expect(dialog?.querySelector('[role="grid"], table')).toBeNull();
    expect(dialog?.textContent).toContain(ITEM.name);
    expect(dialog?.querySelectorAll('p')).toHaveLength(1);
    expect(dialog?.querySelector('p')?.textContent).toBe(`plugin_navigation_tree_delete_confirmation_single ${ITEM.name} ${ITEM.type}`);
    expect(dialog?.querySelector('img')?.getAttribute('src')).toBe('/icons/preload/error_icon.svg');
    const deleteButton = [...document.querySelectorAll('button')].find(button => button.textContent === 'ui_delete');
    expect(deleteButton?.disabled).toBe(false);

    await act(() => {
      dialog?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    });
    await expect(result).resolves.toMatchObject({ status: DialogueStateResult.Rejected });
  });

  it('shows selection, name and location columns, with the object type on the icon', async () => {
    const second = {
      ...ITEM,
      id: 'connection-2',
      name: 'Another connection',
    };
    const result = dialogs.open(NodeDeletionDialog, { items: [ITEM, second] });

    await act(() => root.render(<DialogsPortal />));
    await vi.waitFor(async () => {
      await act(() => Promise.resolve());
      expect(document.querySelector('[role="grid"]')).not.toBeNull();
    });

    const dialog = document.querySelector('[role="dialog"]');
    expect(dialog?.getAttribute('data-size')).toBe('large');
    const grid = dialog?.querySelector('[role="grid"]');
    expect(grid).not.toBeNull();
    expect(grid?.closest('[role="region"]')?.getAttribute('aria-label')).toBe('ui_data_delete_confirmation');
    expect(grid?.getAttribute('aria-rowcount')).toBe('3');
    expect(grid?.getAttribute('aria-colcount')).toBe('3');
    expect(grid?.querySelector('[role="columnheader"][aria-colindex="3"]')?.textContent).toBe('plugin_navigation_tree_delete_location');
    expect(grid?.querySelector('[role="columnheader"][aria-colindex="4"]')).toBeNull();
    expect(grid?.querySelector('img')?.getAttribute('title')).toBe('connection');
    expect(grid?.querySelector('img')?.getAttribute('alt')).toBe('connection');
    const deleteButton = [...document.querySelectorAll('button')].find(button => button.textContent === 'ui_delete (2)');
    expect(deleteButton?.disabled).toBe(false);

    await act(() => deleteButton?.click());
    await expect(result).resolves.toMatchObject({ status: DialogueStateResult.Resolved, result: [ITEM.id, second.id] });
  });

  it('dims skipped rows, keeps the explanation on their checkbox and counts only deletable objects', async () => {
    const result = dialogs.open(NodeDeletionDialog, {
      items: [ITEM, { ...ITEM, id: 'readonly', name: 'Read-only connection', reason: 'plugin_navigation_tree_delete_unavailable' }],
    });
    await act(() => root.render(<DialogsPortal />));
    await vi.waitFor(async () => {
      await act(() => Promise.resolve());
      expect(document.querySelector('[role="grid"]')).not.toBeNull();
    });
    const dialog = document.querySelector('[role="dialog"]');
    expect(dialog?.querySelector('strong')?.textContent).toBe('plugin_navigation_tree_delete_selection_count 1 2');
    expect(dialog?.textContent).toContain('plugin_navigation_tree_delete_selection_summary');
    expect(dialog?.textContent).toContain('Read-only connection');
    expect(dialog?.querySelector('ul')).toBeNull();
    const rows = [...dialog!.querySelectorAll('[role="row"]')];
    const skipped = rows.find(row => row.textContent?.includes('Read-only connection'));
    const skippedCells = [...skipped!.querySelectorAll('[role="gridcell"]')];
    expect(skippedCells).toHaveLength(3);
    expect(skipped?.querySelector('input')?.disabled).toBe(true);
    for (const cell of skippedCells.slice(1)) {
      expect(cell.querySelector('span[title]')?.classList.contains('tw:opacity-40')).toBe(true);
    }
    expect(skippedCells[0]?.querySelector('[title="plugin_navigation_tree_delete_unavailable"]')).not.toBeNull();
    const available = rows.find(row => row.querySelector('[role="gridcell"][aria-colindex="2"]')?.textContent === 'Connection');
    expect(available).toBeDefined();
    for (const cell of [...available!.querySelectorAll('[role="gridcell"]')].slice(1)) {
      expect(cell.querySelector('span[title]')?.classList.contains('tw:opacity-40')).toBe(false);
    }
    const button = [...document.querySelectorAll('button')].find(button => button.textContent === 'ui_delete (1)');
    expect(button?.disabled).toBe(false);
    await act(() => button?.click());
    await expect(result).resolves.toMatchObject({ status: DialogueStateResult.Resolved });
  });

  it('updates selection, warnings and the delete action, and resolves only checked IDs', async () => {
    const warning = 'folder-warning';
    const result = dialogs.open(NodeDeletionDialog, {
      items: [ITEM, { ...ITEM, id: 'folder', name: 'Folder', warning }, { ...ITEM, id: 'readonly', reason: 'unavailable' }],
    });
    await act(() => root.render(<DialogsPortal />));
    await vi.waitFor(() => expect(document.querySelectorAll('input[type="checkbox"]')).toHaveLength(4));
    const [all, first, folder, readonly] = [...document.querySelectorAll<HTMLInputElement>('input[type="checkbox"]')];
    expect(all?.checked).toBe(true);
    expect(readonly?.disabled).toBe(true);
    await act(() => folder?.click());
    expect(all?.indeterminate).toBe(true);
    expect(document.querySelector('[role="dialog"]')?.textContent).not.toContain(warning);
    expect(folder?.checked).toBe(false);
    const deleteButton = [...document.querySelectorAll('button')].find(button => button.textContent?.startsWith('ui_delete'))!;
    expect(deleteButton.textContent).toBe('ui_delete (1)');
    await act(() => first?.click());
    expect(deleteButton.disabled).toBe(true);
    expect(deleteButton.textContent).toBe('ui_delete (0)');
    await act(() => all?.click());
    expect(deleteButton.textContent).toBe('ui_delete (2)');
    expect(readonly?.checked).toBe(false);
    await act(() => all?.click());
    expect(deleteButton.disabled).toBe(true);
    await act(() => first?.click());
    await act(() => deleteButton.click());
    await expect(result).resolves.toMatchObject({ status: DialogueStateResult.Resolved, result: [ITEM.id] });
  });

  it.each([false, true])('shows the existing readonly icon independently of deletion permissions: %s', async disabled => {
    const result = dialogs.open(NodeDeletionDialog, {
      items: [
        ITEM,
        {
          ...ITEM,
          id: 'readonly',
          name: 'Read-only connection',
          readOnly: true,
          reason: disabled ? 'plugin_connections_delete_read_only' : undefined,
        },
      ],
    });
    await act(() => root.render(<DialogsPortal />));
    await vi.waitFor(async () => {
      await act(() => Promise.resolve());
      expect(document.querySelector('[role="grid"] img[src="/icons/lock.png"]')).not.toBeNull();
    });
    const grid = document.querySelector('[role="grid"]')!;
    const readonly = [...grid.querySelectorAll('[role="row"]')].find(row => row.textContent?.includes('Read-only connection'))!;
    const icon = readonly.querySelector('img[src="/icons/lock.png"]')!;
    expect(icon.getAttribute('title')).toBe('ui_readonly');
    expect(icon.getAttribute('alt')).toBe('ui_readonly');
    expect(readonly.querySelector('img[src="/icons/connection.svg"]')).not.toBeNull();
    expect(readonly.querySelector('input')?.disabled).toBe(disabled);
    expect(grid.querySelectorAll('img[src="/icons/lock.png"]')).toHaveLength(1);
    await act(() => document.querySelector('[role="dialog"]')?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })));
    await expect(result).resolves.toMatchObject({ status: DialogueStateResult.Rejected });
  });

  it('unchecks ancestors when a child is unchecked and selects descendants with their parent', async () => {
    dialogs.open(NodeDeletionDialog, { items: [ITEM, { ...ITEM, id: 'child', ancestors: [ITEM.id] }] });
    await act(() => root.render(<DialogsPortal />));
    await vi.waitFor(() => expect(document.querySelectorAll('input[type="checkbox"]')).toHaveLength(3));
    const [, parent, child] = [...document.querySelectorAll<HTMLInputElement>('input[type="checkbox"]')];
    await act(() => child?.click());
    expect(parent?.checked).toBe(false);
    expect(child?.checked).toBe(false);
    await act(() => parent?.click());
    expect(parent?.checked).toBe(true);
    expect(child?.checked).toBe(true);
  });

  it.each([false, true])('uses a list for the folder warning only when a selection summary is also present: %s', async withSummary => {
    const warning = 'plugin_navigation_tree_file_system_delete_folder_warning';
    const items = [{ ...ITEM, warning }];
    const result = dialogs.open(NodeDeletionDialog, {
      items: withSummary ? [...items, { ...ITEM, id: 'readonly', reason: 'plugin_navigation_tree_delete_unavailable' }] : items,
    });
    await act(() => root.render(<DialogsPortal />));
    const dialog = document.querySelector('[role="dialog"]');
    if (withSummary) {
      const list = dialog?.querySelector('ul');
      expect(list?.querySelectorAll('li')).toHaveLength(2);
      expect(list?.querySelector('li strong')?.textContent).toBe('plugin_navigation_tree_delete_selection_count 1 2');
      expect(list?.querySelector('li:last-child')?.textContent).toBe(warning);
    } else {
      expect(dialog?.querySelector('ul')).toBeNull();
      expect([...dialog!.querySelectorAll('p')].map(paragraph => paragraph.textContent)).toContain(warning);
    }
    await act(() => dialog?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })));
    await expect(result).resolves.toMatchObject({ status: DialogueStateResult.Rejected });
  });
});
