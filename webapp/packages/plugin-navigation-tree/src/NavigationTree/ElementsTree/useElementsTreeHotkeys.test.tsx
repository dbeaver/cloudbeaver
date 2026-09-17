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
import type { NavNode } from '@cloudbeaver/core-navigation-tree';

import { useElementsTreeHotkeys } from './useElementsTreeHotkeys.js';

function createModel(hasChildren = true) {
  const node = { uri: 'selected', hasChildren } as NavNode;
  return {
    node,
    tree: {
      disabled: false,
      getSelected: vi.fn(() => [node.uri]),
      expand: vi.fn(async () => {}),
      collapse: vi.fn(),
      open: vi.fn(async () => {}),
    },
    resource: {
      get: vi.fn((): NavNode | undefined => node),
      getParents: vi.fn(() => ['root']),
    },
    onKeyDown: vi.fn(),
  };
}

function TestTree({ model }: { model: ReturnType<typeof createModel> }) {
  const listRef = useListKeyboardNavigation('[data-tree-node-control][tabindex]:not(:disabled)');
  const hotkeysRef = useElementsTreeHotkeys(model.tree, model.resource);
  const ref = useMergeRefs(listRef, hotkeysRef);
  return (
    <div ref={ref}>
      <div tabIndex={0} data-testid="focused" data-tree-node-control onKeyDown={model.onKeyDown}>
        Focused node
        <input aria-label="Rename" />
        <button type="button">Action</button>
      </div>
      <div tabIndex={-1} data-testid="next" data-tree-node-control>
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

  it('collapses the selection on every ArrowLeft without moving focus', async () => {
    const { model, focused } = setup();
    await press(focused, 'ArrowLeft');
    await press(focused, 'ArrowLeft');
    expect(model.tree.collapse.mock.calls).toEqual([['selected'], ['selected']]);
    expect(model.tree.expand).not.toHaveBeenCalled();
    expect(model.tree.open).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(focused);
  });

  it.each([true, false])('opens the selected node with Enter (hasChildren: %s)', async hasChildren => {
    const { model, focused } = setup(hasChildren);
    await press(focused, 'Enter');
    expect(model.tree.open).toHaveBeenCalledExactlyOnceWith(model.node, ['root'], !hasChildren);
    expect(model.tree.expand).not.toHaveBeenCalled();
    expect(model.tree.collapse).not.toHaveBeenCalled();
    expect(model.onKeyDown).not.toHaveBeenCalled();
  });

  it('retrieves the latest selection without rerendering', async () => {
    const { model, focused } = setup();
    await press(focused, 'ArrowRight');
    model.tree.getSelected.mockReturnValue(['another']);
    await press(focused, 'ArrowLeft');
    expect(model.resource.get).toHaveBeenLastCalledWith('another');
    expect(model.tree.collapse).toHaveBeenCalledExactlyOnceWith('another');
  });

  it.each(['empty', 'missing'])('ignores unavailable selections (%s)', async selection => {
    const { model, focused } = setup();
    if (selection === 'empty') {
      model.tree.getSelected.mockReturnValue([]);
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
    await press(getByTestId('next'), 'ArrowUp');
    expect(document.activeElement).toBe(focused);
    expect(model.tree.getSelected).not.toHaveBeenCalled();
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
