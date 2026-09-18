/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useListKeyboardNavigation, useMergeRefs } from '@cloudbeaver/core-blocks';
import { EObjectFeature, type NavNode } from '@cloudbeaver/core-navigation-tree';

import { isLeaf } from './NavigationTreeNode/useNavigationNode.js';
import { useElementsTreeHotkeys } from './useElementsTreeHotkeys.js';

function createModel(hasChildren = true) {
  const node: NavNode = {
    uri: 'selected',
    hasChildren,
    objectFeatures: [],
    folder: false,
    inline: false,
    navigable: true,
    filtered: false,
  };
  const child: NavNode = { ...node, uri: 'child', parentId: node.uri, hasChildren: false };
  let selected = [node.uri];
  let expanded = false;
  return {
    node,
    child,
    tree: {
      disabled: false,
      getSelected: vi.fn(() => selected),
      select: vi.fn((node: NavNode) => {
        selected = [node.uri];
        return Promise.resolve();
      }),
      isNodeExpanded: vi.fn((id: string) => id === node.uri && expanded),
      getNodeChildren: vi.fn((id: string) => (id === node.uri && hasChildren ? [child.uri] : [])),
      expand: vi.fn(() => {
        expanded = true;
        return Promise.resolve();
      }),
      collapse: vi.fn(() => {
        expanded = false;
      }),
      open: vi.fn(async () => {}),
    },
    resource: {
      get: vi.fn((id: string): NavNode | undefined => (id === child.uri ? child : node)),
      getParents: vi.fn(() => ['root']),
    },
    onKeyDown: vi.fn(),
  };
}

function TestTree({ model }: { model: ReturnType<typeof createModel> }) {
  const listRef = useListKeyboardNavigation('[data-tree-node-control][tabindex]:not(:disabled)');
  const hotkeysRef = useElementsTreeHotkeys(model.tree, model.resource, node => isLeaf(node, undefined, undefined, true));
  const ref = useMergeRefs(listRef, hotkeysRef);
  return (
    <div ref={ref}>
      <div tabIndex={0} data-testid="focused" data-navigation-node-id="selected" data-tree-node-control onKeyDown={model.onKeyDown}>
        Focused node
        <input aria-label="Rename" />
        <button type="button">Action</button>
      </div>
      <div tabIndex={-1} data-testid="next" data-navigation-node-id="child" data-tree-node-control>
        Next node
      </div>
    </div>
  );
}

function setup(hasChildren = true) {
  const model = createModel(hasChildren);
  const view = render(<TestTree model={model} />);
  const focused = view.getByTestId('focused');
  act(() => focused.focus());
  return { model, focused, ...view };
}

async function press(target: Element, key: string, options: KeyboardEventInit = {}) {
  await act(() => {
    fireEvent.keyDown(target, { key, code: key, ...options });
    fireEvent.keyUp(target, { key, code: key });
  });
}

afterEach(cleanup);

describe('useElementsTreeHotkeys', () => {
  it('enters an expanded branch and returns to its parent', async () => {
    const { model, focused, getByTestId } = setup();
    const sibling = document.createElement('div');
    sibling.tabIndex = -1;
    sibling.dataset['treeNodeControl'] = 'true';
    sibling.dataset['navigationNodeId'] = 'sibling';
    focused.after(sibling);
    await press(focused, 'ArrowRight');
    await press(focused, 'ArrowRight');
    const child = getByTestId('next');
    expect(document.activeElement).toBe(child);
    expect(model.tree.getSelected()).toEqual(['child']);
    await press(child, 'ArrowLeft');
    expect(document.activeElement).toBe(focused);
    expect(model.tree.getSelected()).toEqual(['selected']);
  });

  it('opens the node reached with ArrowDown instead of the previously selected parent', async () => {
    const { model, focused, getByTestId } = setup();
    await press(focused, 'ArrowDown');
    await press(getByTestId('next'), 'Enter');
    expect(model.tree.open).toHaveBeenCalledExactlyOnceWith(model.child, ['root'], true);
  });

  it.each([true, false])('expands only the selected node with ArrowRight (hasChildren: %s)', async hasChildren => {
    const { model, focused } = setup(hasChildren);
    await press(focused, 'ArrowRight');
    expect(model.resource.get).toHaveBeenCalledExactlyOnceWith('selected');
    expect(model.tree.expand).toHaveBeenCalledExactlyOnceWith(model.node, true);
    expect(model.tree.open).not.toHaveBeenCalled();
    expect(model.tree.collapse).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(focused);
    expect(model.onKeyDown).not.toHaveBeenCalled();
  });

  it('collapses an expanded node, then keeps focus at the tree boundary', async () => {
    const { model, focused } = setup();
    model.tree.isNodeExpanded.mockReturnValueOnce(true);
    await press(focused, 'ArrowLeft');
    await press(focused, 'ArrowLeft');
    expect(model.tree.collapse).toHaveBeenCalledExactlyOnceWith('selected');
    expect(model.tree.expand).not.toHaveBeenCalled();
    expect(model.tree.open).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(focused);
  });

  it('opens the selected leaf with Enter', async () => {
    const { model, focused } = setup(false);
    await press(focused, 'Enter');
    expect(model.tree.open).toHaveBeenCalledExactlyOnceWith(model.node, ['root'], true);
    expect(model.tree.expand).not.toHaveBeenCalled();
    expect(model.tree.collapse).not.toHaveBeenCalled();
    expect(model.onKeyDown).not.toHaveBeenCalled();
  });

  it('expands and collapses the selected branch with Enter without moving focus', async () => {
    const { model, focused } = setup();
    await press(focused, 'Enter');
    expect(model.tree.expand).toHaveBeenCalledExactlyOnceWith(model.node, true);
    expect(model.tree.isNodeExpanded(model.node.uri)).toBe(true);
    await press(focused, 'Enter');
    expect(model.tree.collapse).toHaveBeenCalledExactlyOnceWith(model.node.uri);
    expect(model.tree.isNodeExpanded(model.node.uri)).toBe(false);
    expect(model.tree.open).not.toHaveBeenCalled();
    expect(model.onKeyDown).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(focused);
  });

  it('opens a table displayed as a leaf even when it has children on the server', async () => {
    const { model, focused } = setup();
    model.node.objectFeatures.push(EObjectFeature.entity);
    await press(focused, 'Enter');
    expect(model.tree.open).toHaveBeenCalledExactlyOnceWith(model.node, ['root'], true);
    expect(model.tree.expand).not.toHaveBeenCalled();
    expect(model.tree.collapse).not.toHaveBeenCalled();
  });

  it('retrieves the latest selection without rerendering', async () => {
    const { model, focused } = setup();
    await press(focused, 'ArrowRight');
    model.tree.getSelected.mockReturnValue(['another']);
    model.tree.isNodeExpanded.mockReturnValue(true);
    await press(focused, 'ArrowLeft');
    expect(model.resource.get).toHaveBeenLastCalledWith('another');
    expect(model.tree.collapse).toHaveBeenCalledExactlyOnceWith('another');
  });

  it.each(['empty', 'missing'])('ignores unavailable selections (%s)', async selection => {
    const { model, focused } = setup();
    if (selection === 'empty') {
      model.tree.getSelected.mockReturnValue([]);
      focused.removeAttribute('data-navigation-node-id');
    } else {
      model.resource.get.mockReturnValue(undefined);
    }
    for (const key of ['ArrowRight', 'ArrowLeft', 'Enter']) {
      await press(focused, key);
    }
    expect(model.tree.expand).not.toHaveBeenCalled();
    expect(model.tree.collapse).not.toHaveBeenCalled();
    expect(model.tree.open).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(focused);
    expect(model.onKeyDown).not.toHaveBeenCalled();
  });

  it('preserves vertical list navigation', async () => {
    const { model, focused, getByTestId } = setup();
    await press(focused, 'ArrowDown');
    expect(document.activeElement).toBe(getByTestId('next'));
    expect(model.tree.select).toHaveBeenLastCalledWith(model.child, false, false);
    await press(getByTestId('next'), 'ArrowUp');
    expect(document.activeElement).toBe(focused);
    expect(model.tree.select).toHaveBeenLastCalledWith(model.node, false, false);
    expect(model.tree.getSelected).not.toHaveBeenCalled();
  });

  it('selects and opens a focused node when entering a tree without a selection', async () => {
    const { model, focused } = setup(false);
    model.tree.getSelected.mockReturnValueOnce([]);
    await press(focused, 'Enter');
    expect(model.tree.select).toHaveBeenCalledExactlyOnceWith(model.node, false, false);
    expect(model.tree.open).toHaveBeenCalledExactlyOnceWith(model.node, ['root'], true);
  });

  it('does not move right to a sibling when the expanded branch has no rendered children', async () => {
    const { model, focused } = setup();
    model.tree.isNodeExpanded.mockReturnValue(true);
    model.tree.getNodeChildren.mockReturnValue(['unmounted']);
    await press(focused, 'ArrowRight');
    expect(document.activeElement).toBe(focused);
    expect(model.tree.select).not.toHaveBeenCalled();
    expect(model.tree.open).not.toHaveBeenCalled();
  });

  it.each(['textbox', 'button'])('does not act on keys in a nested %s', async role => {
    const { model, getByRole } = setup();
    const control = getByRole(role);
    act(() => control.focus());
    for (const key of ['ArrowRight', 'ArrowLeft', 'Enter']) {
      await press(control, key);
    }
    expect(model.tree.getSelected).not.toHaveBeenCalled();
  });

  it('ignores keys outside the tree and repeated Enter', async () => {
    const { model, focused } = setup();
    await press(document.body, 'Enter');
    await press(focused, 'Enter', { repeat: true });
    expect(model.tree.open).not.toHaveBeenCalled();
    expect(model.tree.expand).not.toHaveBeenCalled();
    expect(model.tree.collapse).not.toHaveBeenCalled();
  });

  it('does not invoke actions when disabled', async () => {
    const { model, focused, rerender } = setup();
    model.tree.disabled = true;
    rerender(<TestTree model={model} />);
    for (const key of ['ArrowRight', 'ArrowLeft', 'Enter']) {
      await press(focused, key);
    }
    expect(model.tree.getSelected).not.toHaveBeenCalled();
  });
});
