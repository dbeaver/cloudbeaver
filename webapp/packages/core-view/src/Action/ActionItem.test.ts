/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { describe, expect, it, vi } from 'vitest';

import { DataContext } from '@cloudbeaver/core-data-context';

import { ActionItem } from './ActionItem.js';
import type { IActionHandler } from './IActionHandler.js';

function createItem(overrides: Partial<IActionHandler> = {}) {
  const context = new DataContext();
  const action = { id: 'action', info: { label: 'action' } };
  const handler: IActionHandler = { id: 'handler', menus: new Set(), actions: new Set(), contexts: new Set(), handler: vi.fn(), ...overrides };
  return { item: new ActionItem(action, handler, null, context), action, context };
}

describe('ActionItem loading indicator', () => {
  it('does not turn dependency loading into action loading', () => {
    const getLoader = vi.fn(() => ({ isLoaded: () => false, isLoading: () => true, isError: () => false, load: vi.fn() }));
    const { item } = createItem({ getLoader });
    expect(item.isLoading()).toBe(false);
    expect(getLoader).not.toHaveBeenCalled();
  });

  it('preserves the explicit loading state and passes the action context', () => {
    const isLoading = vi.fn(() => true);
    const { item, context, action } = createItem({ isLoading });
    expect(item.isLoading()).toBe(true);
    expect(isLoading).toHaveBeenCalledWith(context, action);
    isLoading.mockReturnValue(false);
    expect(item.isLoading()).toBe(false);
  });
});
