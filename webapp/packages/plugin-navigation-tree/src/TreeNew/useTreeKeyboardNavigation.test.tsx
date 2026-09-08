/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { act, useCallback, useMemo } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { INode } from './INode.js';
import type { INodeState } from './INodeState.js';
import type { ITreeData } from './ITreeData.js';
import type { ITree } from './useTree.js';
import { type ITreeKeyboardNavigation, useTreeKeyboardNavigation } from '../useTreeKeyboardNavigation.js';

interface ITestTree {
  data: ITreeData;
  states: Record<string, INodeState>;
  tree: ITree;
}

const children: Record<string, string[]> = {
  root: ['parent', 'sibling'],
  parent: ['child'],
  child: [],
  sibling: [],
};
const parents: Record<string, string | null> = {
  root: null,
  parent: 'root',
  child: 'parent',
  sibling: 'root',
};

function createTestTree(): ITestTree {
  const states: Record<string, INodeState> = {
    root: { expanded: true, selected: false },
    parent: { expanded: true, selected: false },
    child: { expanded: false, selected: true },
    sibling: { expanded: false, selected: false },
  };
  const data: ITreeData = {
    rootId: 'root',
    getNode(id): INode {
      return { name: id, leaf: children[id]?.length === 0 };
    },
    getChildren: id => children[id] ?? [],
    getUnfilteredChildren: id => children[id] ?? [],
    getParent: id => parents[id] ?? null,
    getState: id => states[id]!,
    updateAllState: vi.fn(),
    updateState(id, state) {
      Object.assign(states[id]!, state);
    },
    load: vi.fn(() => Promise.resolve()),
    update: vi.fn(() => Promise.resolve()),
  };
  const tree: ITree = {
    getNodeComponent: vi.fn(() => null),
    getNodeHeight: vi.fn(() => 24),
    openNode: vi.fn(() => Promise.resolve()),
    clickNode: vi.fn(() => Promise.resolve()),
    activateNode: vi.fn(() => Promise.resolve()),
    expandNode: vi.fn((id, expanded) => {
      data.updateState(id, { expanded });
      return Promise.resolve();
    }),
    selectNode: vi.fn(id => data.updateState(id, { selected: true })),
  };

  return { data, states, tree };
}

const TestNode = observer(function TestNode({
  navigation,
  model,
  nodeId,
  nestedControl,
}: {
  navigation: ITreeKeyboardNavigation;
  model: ITestTree;
  nodeId: string;
  nestedControl?: boolean;
}) {
  const actions = useMemo(
    () => ({
      async activate() {
        model.tree.selectNode(nodeId);
        await model.tree.activateNode(nodeId);
      },
      setExpanded(expanded: boolean) {
        return model.tree.expandNode(nodeId, expanded);
      },
    }),
    [model, nodeId],
  );
  const ref = useCallback((element: HTMLDivElement | null) => navigation.registerNode(nodeId, element, actions), [actions, navigation, nodeId]);

  return (
    <div ref={ref} role="treeitem" data-tree-node-id={nodeId} tabIndex={navigation.activeNodeId === nodeId ? 0 : -1}>
      {nestedControl && (
        <>
          <button type="button">Action</button>
          <input aria-label="Name" role="button" />
          <div role="menu">
            <button type="button" role="menuitem">
              Menu item
            </button>
          </div>
        </>
      )}
    </div>
  );
});

const TestTree = observer(function TestTree({
  model,
  mountedNodeIds,
  revealNode = vi.fn(),
}: {
  model: ITestTree;
  mountedNodeIds: string[];
  revealNode?: (nodeId: string) => void;
}) {
  const navigation = useTreeKeyboardNavigation({
    rootId: model.data.rootId,
    getParent: nodeId => model.data.getParent(nodeId),
    getChildren: nodeId => model.data.getChildren(nodeId),
    isExpanded: nodeId => model.data.getState(nodeId).expanded,
    isLeaf: nodeId => !!model.data.getNode(nodeId).leaf,
    isSelected: nodeId => model.data.getState(nodeId).selected,
    revealNode,
  });

  return (
    <div
      ref={navigation.setRootRef}
      role="tree"
      tabIndex={navigation.activeNodeMounted ? -1 : 0}
      onFocusCapture={navigation.onFocusCapture}
      onKeyDown={navigation.onKeyDown}
    >
      {mountedNodeIds.map(nodeId => (
        <TestNode key={nodeId} navigation={navigation} model={model} nodeId={nodeId} nestedControl={nodeId !== 'sibling'} />
      ))}
    </div>
  );
});

describe('useTreeKeyboardNavigation', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  async function renderTree(model: ITestTree, mountedNodeIds = ['parent', 'child', 'sibling'], revealNode?: (nodeId: string) => void) {
    await act(() => root.render(<TestTree model={model} mountedNodeIds={mountedNodeIds} revealNode={revealNode} />));
  }

  function getNode(nodeId: string): HTMLElement {
    return container.querySelector<HTMLElement>(`[data-tree-node-id="${nodeId}"]`)!;
  }

  it('uses the selected node as the initial tab stop and moves focus without changing selection', async () => {
    const model = createTestTree();
    await renderTree(model);
    const child = getNode('child');

    expect(child.tabIndex).toBe(0);
    child.focus();
    child.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'ArrowDown' }));
    await act(() => Promise.resolve());

    expect(document.activeElement).toBe(getNode('sibling'));
    expect(model.tree.selectNode).not.toHaveBeenCalled();

    getNode('sibling').dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'Home' }));
    await act(() => Promise.resolve());
    expect(document.activeElement).toBe(getNode('parent'));
  });

  it('selects and then activates any node once on Enter', async () => {
    const model = createTestTree();
    const actions: string[] = [];
    let finishActivation!: () => void;
    const activation = new Promise<void>(resolve => {
      finishActivation = resolve;
    });
    vi.mocked(model.tree.selectNode).mockImplementation(() => actions.push('select'));
    vi.mocked(model.tree.activateNode).mockImplementation(() => {
      actions.push('activate');
      return activation;
    });
    await renderTree(model);
    const parent = getNode('parent');

    parent.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'Enter' }));
    parent.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'Enter' }));
    parent.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'Enter', repeat: true }));
    await act(() => Promise.resolve());

    expect(actions).toEqual(['select', 'activate']);
    finishActivation();
    await act(() => activation);
  });

  it('navigates from nested buttons but preserves their Enter and input keys', async () => {
    const model = createTestTree();
    await renderTree(model);
    const button = getNode('child').querySelector('button')!;
    const input = getNode('child').querySelector('input')!;
    const menuItem = getNode('child').querySelector<HTMLElement>('[role="menuitem"]')!;
    const nestedEvent = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'ArrowDown' });
    const enterEvent = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'Enter' });
    const inputEvent = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'ArrowDown' });
    const menuEvent = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'ArrowDown' });
    const modifiedEvent = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'ArrowRight', shiftKey: true });

    button.focus();
    button.dispatchEvent(nestedEvent);
    await act(() => Promise.resolve());

    expect(document.activeElement).toBe(getNode('sibling'));

    button.focus();
    button.dispatchEvent(enterEvent);
    input.focus();
    input.dispatchEvent(inputEvent);
    menuItem.focus();
    menuItem.dispatchEvent(menuEvent);
    getNode('parent').dispatchEvent(modifiedEvent);

    expect(nestedEvent.defaultPrevented).toBe(true);
    expect(enterEvent.defaultPrevented).toBe(false);
    expect(inputEvent.defaultPrevented).toBe(false);
    expect(menuEvent.defaultPrevented).toBe(false);
    expect(modifiedEvent.defaultPrevented).toBe(false);
    expect(model.tree.activateNode).not.toHaveBeenCalled();
    expect(model.tree.expandNode).not.toHaveBeenCalled();
  });

  it('activates a leaf with ArrowRight from its nested button', async () => {
    const model = createTestTree();
    await renderTree(model);
    const button = getNode('child').querySelector('button')!;

    button.focus();
    button.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'ArrowRight' }));
    await act(() => Promise.resolve());

    expect(model.tree.selectNode).toHaveBeenCalledWith('child');
    expect(model.tree.activateNode).toHaveBeenCalledWith('child');
  });

  it('expands a closed branch with ArrowRight from its nested button', async () => {
    const model = createTestTree();
    model.states['parent']!.expanded = false;
    await renderTree(model, ['parent', 'sibling']);
    const parent = getNode('parent');
    const button = parent.querySelector('button')!;

    button.focus();
    button.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'ArrowRight' }));
    await act(() => Promise.resolve());

    expect(model.tree.expandNode).toHaveBeenCalledWith('parent', true);
    expect(document.activeElement).toBe(parent);
  });

  it('collapses an open branch and moves from a closed child to its parent with ArrowLeft', async () => {
    const model = createTestTree();
    await renderTree(model);
    const parent = getNode('parent');

    parent.focus();
    parent.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'ArrowLeft' }));
    await act(() => Promise.resolve());
    expect(model.tree.expandNode).toHaveBeenCalledWith('parent', false);

    model.states['parent']!.expanded = true;
    getNode('child').focus();
    getNode('child').dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'ArrowLeft' }));
    await act(() => Promise.resolve());
    expect(document.activeElement).toBe(parent);
  });

  it('allows repeated arrows but does not start a parallel expansion', async () => {
    const model = createTestTree();
    model.states['parent']!.expanded = false;
    let finishExpansion!: () => void;
    const expansion = new Promise<void>(resolve => {
      finishExpansion = resolve;
    });
    vi.mocked(model.tree.expandNode).mockReturnValue(expansion);
    await renderTree(model, ['parent', 'sibling']);
    const parent = getNode('parent');

    parent.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'ArrowRight', repeat: true }));
    parent.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'ArrowRight', repeat: true }));
    await act(() => Promise.resolve());

    expect(model.tree.expandNode).toHaveBeenCalledOnce();
    finishExpansion();
    await act(() => expansion);
  });

  it('reveals and focuses a virtualized node', async () => {
    const model = createTestTree();
    model.states['parent']!.expanded = false;
    const revealNode = vi.fn((nodeId: string) => {
      void act(() => root.render(<TestTree model={model} mountedNodeIds={['parent', nodeId]} revealNode={revealNode} />));
    });
    await renderTree(model, ['parent'], revealNode);
    const parent = getNode('parent');
    parent.focus();

    parent.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'ArrowDown' }));
    await act(() => Promise.resolve());

    expect(revealNode).toHaveBeenCalledWith('sibling');
    expect(document.activeElement).toBe(getNode('sibling'));
  });

  it('moves focus to the parent when the active child disappears after collapse', async () => {
    const model = createTestTree();
    await renderTree(model);
    getNode('child').focus();
    model.states['parent']!.expanded = false;

    await act(() => root.render(<TestTree model={model} mountedNodeIds={['parent', 'sibling']} />));
    await act(() => Promise.resolve());

    expect(document.activeElement).toBe(getNode('parent'));
    expect(getNode('parent').tabIndex).toBe(0);
  });

  it('replaces a stale active node that was unmounted before it was removed', async () => {
    const model = createTestTree();
    await renderTree(model);
    getNode('child').focus();

    await act(() => root.render(<TestTree model={model} mountedNodeIds={['parent', 'sibling']} />));
    model.data.getChildren = id => (id === 'parent' ? [] : (children[id] ?? []));
    const treeElement = container.querySelector<HTMLElement>('[role="tree"]')!;
    treeElement.focus();
    await act(() => Promise.resolve());

    expect(document.activeElement).toBe(getNode('parent'));
    expect(getNode('parent').tabIndex).toBe(0);
  });

  it('returns focus to the tree when its last node disappears', async () => {
    const model = createTestTree();
    model.states['parent']!.expanded = false;
    await renderTree(model, ['parent']);
    getNode('parent').focus();
    model.data.getChildren = () => [];

    await act(() => root.render(<TestTree model={model} mountedNodeIds={[]} />));
    await act(() => Promise.resolve());

    expect(document.activeElement).toBe(container.querySelector('[role="tree"]'));
  });

  it('moves focus from an empty tree root to the first node when data appears', async () => {
    const model = createTestTree();
    model.data.getChildren = () => [];
    await renderTree(model, []);
    const treeElement = container.querySelector<HTMLElement>('[role="tree"]')!;
    treeElement.focus();
    model.data.getChildren = id => children[id] ?? [];
    const revealNode = vi.fn((nodeId: string) => {
      void act(() => root.render(<TestTree model={model} mountedNodeIds={['parent', nodeId]} revealNode={revealNode} />));
    });

    await act(() => root.render(<TestTree model={model} mountedNodeIds={['parent']} revealNode={revealNode} />));
    await act(() => Promise.resolve());

    expect(revealNode).toHaveBeenCalledWith('child');
    expect(document.activeElement).toBe(getNode('child'));
  });
});
