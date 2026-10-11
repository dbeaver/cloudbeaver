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

import { NodeDeletionDialog } from './NodeDeletionDialog.js';
import type { INodeDeletionItem } from './NodeDeletionPlan.js';

const ITEM: INodeDeletionItem = {
  node: {
    uri: 'connection',
    name: 'Connection',
    icon: '/icons/connection.svg',
    folder: false,
    hasChildren: false,
    inline: false,
    navigable: true,
    filtered: false,
    objectFeatures: [],
  },
  type: 'connection',
  project: 'Project',
  location: 'Folder',
  ancestors: [],
  provider: {
    isApplicable: () => true,
    getInfo: () => ({ type: 'connection' }),
    handler: () => Promise.resolve(),
  },
};

describe('NodeDeletionDialog', () => {
  let root: Root;
  let container: HTMLDivElement;
  let dialogs: CommonDialogService;

  beforeEach(() => {
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
    vi.stubGlobal('_ROOT_URI_', '/');
    dialogs = new CommonDialogService();
    vi.spyOn(DI, 'useService').mockImplementation(token => {
      if (token === LocalizationService) {
        return {
          translate: (token: string, _defaultValue?: string, args?: { name?: string; entity?: string }) =>
            [token, args?.name, args?.entity].filter(Boolean).join(' '),
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
    expect(dialog?.textContent).toContain(ITEM.node.name);
    expect(dialog?.querySelectorAll('p')).toHaveLength(1);
    expect(dialog?.querySelector('p')?.textContent).toBe(`plugin_navigation_tree_delete_confirmation_single ${ITEM.node.name} ${ITEM.type}`);
    expect(dialog?.querySelector('img')?.getAttribute('src')).toBe('/icons/preload/error_icon.svg');
    const deleteButton = [...document.querySelectorAll('button')].find(button => button.textContent === 'ui_delete');
    expect(deleteButton?.disabled).toBe(false);

    await act(() => {
      dialog?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    });
    await expect(result).resolves.toMatchObject({ status: DialogueStateResult.Rejected });
  });

  it('shows only name and location columns, with the object type on the icon', async () => {
    const second = {
      ...ITEM,
      node: { ...ITEM.node, uri: 'connection-2', name: 'Another connection' },
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
    expect(grid?.getAttribute('aria-colcount')).toBe('2');
    expect(grid?.querySelector('img')?.getAttribute('title')).toBe('connection');
    expect(grid?.querySelector('img')?.getAttribute('alt')).toBe('connection');
    const deleteButton = [...document.querySelectorAll('button')].find(button => button.textContent === 'ui_delete (2)');
    expect(deleteButton?.disabled).toBe(false);

    await act(() => deleteButton?.click());
    await expect(result).resolves.toMatchObject({ status: DialogueStateResult.Resolved });
  });
});
