/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observable, runInAction } from 'mobx';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as coreDi from '@cloudbeaver/core-di';

import type { INodeState } from './INodeState.js';
import type { ITreeData } from './ITreeData.js';
import { Tree } from './Tree.js';
import * as nodeDnDModule from './useNodeDnD.js';

describe('Tree keyboard activation', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    vi.spyOn(nodeDnDModule, 'useNodeDnD').mockReturnValue({
      state: { isDragging: false, isOverCurrent: false, canDrop: false },
      setRef: () => {},
    });
    const useService = coreDi.useService;
    vi.spyOn(coreDi, 'useService').mockImplementation(service => {
      if (service.name === 'LocalizationService') {
        return { translate: (key: string) => key };
      }
      return useService(service);
    });
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
    vi.stubGlobal('_ROOT_URI_', '/');
    container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('activates the last leaf after moving past a collapsed branch without expanding it', async () => {
    const children: Record<string, string[]> = {
      root: ['first', 'branch', 'last'],
      first: [],
      branch: ['child-1', 'child-2'],
      'child-1': [],
      'child-2': [],
      last: [],
    };
    const states = observable<Record<string, INodeState>>(
      Object.fromEntries(Object.keys(children).map(id => [id, { expanded: id === 'root', selected: id === 'first' }])),
    );
    const data: ITreeData = {
      rootId: 'root',
      getNode: id => ({ name: id, leaf: children[id]!.length === 0 }),
      getChildren: id => children[id]!,
      getUnfilteredChildren: id => children[id]!,
      getParent(id) {
        if (id === 'root') {
          return null;
        }
        return id.startsWith('child-') ? 'branch' : 'root';
      },
      getState: id => states[id]!,
      updateState: vi.fn((id, state) => runInAction(() => Object.assign(states[id]!, state))),
      updateAllState: vi.fn(),
      load: vi.fn(async () => {}),
      update: vi.fn(async () => {}),
    };
    const activate = vi.fn((id: string) => {
      expect(data.getState(id).selected).toBe(true);
    });
    await act(() => root.render(<Tree data={data} getNodeHeight={() => 24} onNodeActivate={activate} />));

    function getNode(id: string) {
      const node = container.querySelector<HTMLElement>(`[data-tree-node-id="${id}"]`);
      expect(node).not.toBeNull();
      return node!;
    }

    async function pressKey(key: string) {
      await act(() => {
        document.activeElement!.dispatchEvent(new KeyboardEvent('keydown', { key, code: key, bubbles: true, cancelable: true }));
      });
      // Arrow navigation can change focus between keydown and keyup.
      await act(() => {
        document.activeElement!.dispatchEvent(new KeyboardEvent('keyup', { key, code: key, bubbles: true, cancelable: true }));
      });
    }

    expect(container.querySelectorAll('[role="treeitem"]')).toHaveLength(3);
    expect(getNode('branch').querySelector('[data-tree-node-content] [role="button"]')).not.toBeNull();
    expect(getNode('branch').getAttribute('aria-expanded')).toBe('false');
    await act(() => getNode('first').focus());
    await pressKey('ArrowDown');
    expect(document.activeElement).toBe(getNode('branch'));
    await pressKey('ArrowDown');
    expect(document.activeElement).toBe(getNode('last'));
    expect(data.updateState).not.toHaveBeenCalled();
    expect(activate).not.toHaveBeenCalled();

    await pressKey('Enter');

    expect(document.activeElement).toBe(getNode('last'));
    expect(data.updateState).toHaveBeenCalledExactlyOnceWith('last', { selected: true });
    expect(activate).toHaveBeenCalledExactlyOnceWith('last');
    expect(getNode('last').getAttribute('aria-selected')).toBe('true');
    expect(data.getState('branch').expanded).toBe(false);
    expect(getNode('branch').getAttribute('aria-expanded')).toBe('false');
    expect(data.load).not.toHaveBeenCalled();
    expect(container.querySelectorAll('[role="treeitem"]')).toHaveLength(3);
  });
});
