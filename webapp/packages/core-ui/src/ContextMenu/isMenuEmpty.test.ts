/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { describe, expect, it } from 'vitest';

import type { ILoadableState } from '@cloudbeaver/core-utils';

import { isMenuEmpty } from './isMenuEmpty.js';

function createLoader(loaded: boolean, outdated = false): ILoadableState {
  return {
    isLoaded: () => loaded,
    isOutdated: () => outdated,
    isLoading: () => false,
    isError: () => false,
    load: () => {},
  };
}

describe('isMenuEmpty', () => {
  it('hides a menu without items or loaders', () => {
    expect(isMenuEmpty({ items: [], loaders: [] })).toBe(true);
  });

  it('hides Manage when every action is hidden and its loaders are already loaded', () => {
    const items = [
      { id: 'edit', hidden: true },
      { id: 'clone', hidden: true },
      { id: 'delete', hidden: true },
      { id: 'change-password', hidden: true },
    ];

    expect(isMenuEmpty({ items, loaders: [createLoader(true), createLoader(true)] })).toBe(true);
  });

  it('hides a loaded menu even when it has no applicable actions', () => {
    expect(isMenuEmpty({ items: [], loaders: [createLoader(true)] })).toBe(true);
  });

  it('keeps Manage available when an action is visible', () => {
    const items = [
      { id: 'edit', hidden: false },
      { id: 'delete', hidden: true },
    ];

    expect(isMenuEmpty({ items, loaders: [createLoader(true)] })).toBe(false);
  });

  it('keeps an empty submenu available until its lazy loader finishes', async () => {
    let loaded = false;
    const loader = createLoader(false);
    loader.isLoaded = () => loaded;
    loader.load = () => {
      loaded = true;
    };
    const menu = { items: [{ id: 'edit', hidden: true }], loaders: [loader] };

    expect(isMenuEmpty(menu)).toBe(false);

    await loader.load();

    expect(isMenuEmpty(menu)).toBe(true);
  });

  it('waits for every loader before hiding an empty submenu', () => {
    expect(isMenuEmpty({ items: [], loaders: [createLoader(true), createLoader(false)] })).toBe(false);
  });

  it('keeps a submenu available when loaded data is outdated', () => {
    expect(isMenuEmpty({ items: [], loaders: [createLoader(true, true)] })).toBe(false);
  });
});
