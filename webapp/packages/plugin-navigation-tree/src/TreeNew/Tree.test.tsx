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

import { Tree } from './Tree.js';
import * as nodeDnDModule from './useNodeDnD.js';
import { useTreeClickSelection } from './useTreeClickSelection.js';
import { useTreeData } from './useTreeData.js';

function deferred() {
  let resolve!: () => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<void>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

describe('Tree interactions', () => {
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

  async function renderTree(loadBranch: () => Promise<void> = async () => {}) {
    const children = observable<Record<string, string[]>>({
      root: ['first', 'branch', 'last'],
      first: [],
      branch: [],
      'child-1': [],
      'child-2': [],
      last: [],
    });
    const load = vi.fn<(id: string, manual: boolean) => Promise<void>>(async id => {
      if (id !== 'branch') {
        return;
      }
      await loadBranch();
      runInAction(() => {
        children['branch'] = ['child-1', 'child-2'];
      });
    });
    const activate = vi.fn();
    function TestTree() {
      const data = useTreeData({
        rootId: 'root',
        getNode: id => ({ name: id, leaf: id !== 'root' && id !== 'branch' }),
        getChildren: id => children[id]!,
        getParent(id) {
          if (id === 'root') {
            return null;
          }
          return id.startsWith('child-') ? 'branch' : 'root';
        },
        load,
      });
      const selection = useTreeClickSelection(data);
      return (
        <Tree
          data={data}
          selection={selection}
          getNodeHeight={() => 24}
          onNodeActivate={id => {
            expect(selection.isSelected(id)).toBe(true);
            activate(id);
          }}
        />
      );
    }
    await act(() => root.render(<TestTree />));
    expect(load).toHaveBeenCalledExactlyOnceWith('root', false);
    load.mockClear();
    return { load, activate };
  }

  function getNode(id: string) {
    const node = container.querySelector<HTMLElement>(`[data-tree-node-id="${id}"]`);
    expect(node).not.toBeNull();
    return node!;
  }

  function visibleNodeIds() {
    return Array.from(container.querySelectorAll<HTMLElement>('[role="treeitem"]'), node => node.dataset['treeNodeId']);
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

  it('activates the last leaf after moving past a collapsed branch and deselects the prior leaf', async () => {
    const { load, activate } = await renderTree();
    expect(container.querySelectorAll('[role="treeitem"]')).toHaveLength(3);
    expect(getNode('branch').querySelector('[data-tree-node-content] [role="button"]')).not.toBeNull();
    expect(getNode('branch').getAttribute('aria-expanded')).toBe('false');
    await act(() => getNode('first').focus());
    await pressKey('Enter');
    expect(getNode('first').getAttribute('aria-selected')).toBe('true');
    expect(activate).toHaveBeenCalledExactlyOnceWith('first');
    activate.mockClear();
    await pressKey('ArrowDown');
    expect(document.activeElement).toBe(getNode('branch'));
    await pressKey('ArrowDown');
    expect(document.activeElement).toBe(getNode('last'));
    expect(getNode('first').getAttribute('aria-selected')).toBe('true');
    expect(getNode('last').getAttribute('aria-selected')).toBe('false');
    expect(activate).not.toHaveBeenCalled();

    await pressKey('Enter');

    expect(document.activeElement).toBe(getNode('last'));
    expect(activate).toHaveBeenCalledExactlyOnceWith('last');
    expect(getNode('last').getAttribute('aria-selected')).toBe('true');
    expect(getNode('first').getAttribute('aria-selected')).toBe('false');
    expect(container.querySelectorAll('[aria-selected="true"]')).toHaveLength(1);
    expect(getNode('branch').getAttribute('aria-expanded')).toBe('false');
    expect(load).not.toHaveBeenCalled();
    expect(container.querySelectorAll('[role="treeitem"]')).toHaveLength(3);
  });

  it('loads a branch once while expansion is pending and navigates to children after success', async () => {
    const pending = deferred();
    const { load, activate } = await renderTree(() => pending.promise);
    await act(() => getNode('branch').focus());
    await pressKey('ArrowRight');

    expect(load).toHaveBeenCalledExactlyOnceWith('branch', true);
    expect(getNode('branch').getAttribute('aria-expanded')).toBe('true');
    expect(visibleNodeIds()).toEqual(['first', 'branch', 'last']);
    expect(document.activeElement).toBe(getNode('branch'));

    await pressKey('ArrowLeft');
    await pressKey('ArrowRight');
    expect(getNode('branch').getAttribute('aria-expanded')).toBe('true');
    expect(load).toHaveBeenCalledTimes(1);
    expect(visibleNodeIds()).toEqual(['first', 'branch', 'last']);

    await act(() => pending.resolve());
    expect(getNode('branch').getAttribute('aria-expanded')).toBe('true');
    expect(visibleNodeIds()).toEqual(['first', 'branch', 'child-1', 'child-2', 'last']);
    expect(document.activeElement).toBe(getNode('branch'));
    await pressKey('ArrowRight');
    expect(document.activeElement).toBe(getNode('child-1'));
    expect(getNode('child-1').getAttribute('aria-selected')).toBe('false');
    expect(activate).not.toHaveBeenCalled();
    expect(load).toHaveBeenCalledTimes(1);
  });

  it('collapses after a rejected load and allows a successful retry', async () => {
    const firstAttempt = deferred();
    const retry = deferred();
    let attempt = firstAttempt;
    const { load } = await renderTree(() => attempt.promise);
    await act(() => getNode('branch').focus());
    await pressKey('ArrowRight');
    expect(getNode('branch').getAttribute('aria-expanded')).toBe('true');

    await act(() => firstAttempt.reject(new Error('Branch load failed')));
    expect(getNode('branch').getAttribute('aria-expanded')).toBe('false');
    expect(visibleNodeIds()).toEqual(['first', 'branch', 'last']);
    expect(document.activeElement).toBe(getNode('branch'));
    expect(load).toHaveBeenCalledExactlyOnceWith('branch', true);

    attempt = retry;
    await pressKey('ArrowRight');
    expect(load).toHaveBeenCalledTimes(2);
    expect(load).toHaveBeenLastCalledWith('branch', true);
    expect(getNode('branch').getAttribute('aria-expanded')).toBe('true');
    expect(visibleNodeIds()).toEqual(['first', 'branch', 'last']);
    await act(() => retry.resolve());

    expect(getNode('branch').getAttribute('aria-expanded')).toBe('true');
    expect(visibleNodeIds()).toEqual(['first', 'branch', 'child-1', 'child-2', 'last']);
    await pressKey('ArrowRight');
    expect(document.activeElement).toBe(getNode('child-1'));
  });

  it('returns focus to the parent when its focused child is removed by collapse', async () => {
    const { load } = await renderTree();
    await act(() => getNode('branch').focus());
    await pressKey('ArrowRight');
    await pressKey('ArrowRight');
    expect(document.activeElement).toBe(getNode('child-1'));
    expect(visibleNodeIds()).toEqual(['first', 'branch', 'child-1', 'child-2', 'last']);

    // A programmatic click leaves focus on the child until collapse removes it.
    const expander = getNode('branch').querySelector<HTMLElement>('[data-tree-node-content] [role="button"]')!;
    await act(() => expander.click());

    expect(getNode('branch').getAttribute('aria-expanded')).toBe('false');
    expect(visibleNodeIds()).toEqual(['first', 'branch', 'last']);
    expect(document.activeElement).toBe(getNode('branch'));
    expect(getNode('branch').tabIndex).toBe(0);
    expect(load).toHaveBeenCalledExactlyOnceWith('branch', true);
    await pressKey('ArrowDown');
    expect(document.activeElement).toBe(getNode('last'));
  });
});
