/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { act, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { renderInApp } from '@cloudbeaver/tests-runner';

import { useListKeyboardNavigation } from '../../useListKeyboardNavigation.js';
import { useMergeRefs } from '../../useMergeRefs.js';
import { useTreeKeyboardActions } from '../useTreeKeyboardActions.js';
import { TreeNode } from './TreeNode.js';
import { TreeNodeControl } from './TreeNodeControl.js';

function KeyboardTree({ children }: React.PropsWithChildren) {
  const listRef = useListKeyboardNavigation('[data-tree-node-control]');
  const keyboardRef = useTreeKeyboardActions();
  const ref = useMergeRefs(listRef, keyboardRef);
  return (
    <div ref={ref} data-testid="tree">
      {children}
    </div>
  );
}

function setup(props: { expanded?: boolean; leaf?: boolean; disabled?: boolean; loading?: boolean } = {}) {
  const expand = vi.fn();
  const open = vi.fn();
  const select = vi.fn();

  function Tree() {
    return (
      <KeyboardTree>
        <TreeNode {...props} selected onExpand={expand} onOpen={open} onSelect={select}>
          <TreeNodeControl data-testid="node">
            Node
            <input aria-label="Rename" />
          </TreeNodeControl>
        </TreeNode>
        <TreeNode>
          <TreeNodeControl data-testid="next">Next</TreeNodeControl>
        </TreeNode>
      </KeyboardTree>
    );
  }

  const view = renderInApp(<Tree />);
  const node = view.getByTestId('node');
  act(() => node.focus());
  return { ...view, node, expand, open, select };
}

describe('Tree keyboard actions', () => {
  it.each([false, true])('moves left to the parent rather than the previous sibling (leaf: %s)', leaf => {
    const expand = vi.fn();
    const view = renderInApp(
      <KeyboardTree>
        <TreeNode expanded>
          <TreeNodeControl data-testid="parent">Parent</TreeNodeControl>
          <div>
            <TreeNode leaf>
              <TreeNodeControl>Previous sibling</TreeNodeControl>
            </TreeNode>
            <TreeNode leaf={leaf} selected onExpand={expand}>
              <TreeNodeControl data-testid="child">Child</TreeNodeControl>
            </TreeNode>
          </div>
        </TreeNode>
      </KeyboardTree>,
    );
    const child = view.getByTestId('child');
    const parent = view.getByTestId('parent');
    act(() => child.focus());
    fireEvent.keyDown(child, { key: 'ArrowLeft' });
    expect(parent).toHaveFocus();
    expect(parent).toHaveAttribute('tabindex', '0');
    expect(child).toHaveAttribute('tabindex', '-1');
    expect(expand).not.toHaveBeenCalled();
  });

  it.each([false, true])('keeps focus on a top-level node on ArrowLeft (leaf: %s)', leaf => {
    const { node, expand } = setup({ leaf });
    fireEvent.keyDown(node, { key: 'ArrowLeft' });
    expect(node).toHaveFocus();
    expect(expand).not.toHaveBeenCalled();
  });

  it('does not move left outside a nested tree', () => {
    const view = renderInApp(
      <KeyboardTree>
        <TreeNode expanded>
          <TreeNodeControl>Outer parent</TreeNodeControl>
          <KeyboardTree>
            <TreeNode leaf selected>
              <TreeNodeControl data-testid="inner">Inner root</TreeNodeControl>
            </TreeNode>
            <TreeNode leaf>
              <TreeNodeControl>Inner sibling</TreeNodeControl>
            </TreeNode>
          </KeyboardTree>
        </TreeNode>
      </KeyboardTree>,
    );
    const inner = view.getByTestId('inner');
    act(() => inner.focus());
    fireEvent.keyDown(inner, { key: 'ArrowLeft' });
    expect(inner).toHaveFocus();
  });

  it.each([false, true])('routes actions to the focused node across trees (nested: %s)', async nested => {
    const firstOpen = vi.fn();
    const secondOpen = vi.fn();
    const firstNode = (
      <TreeNode leaf onOpen={firstOpen}>
        <TreeNodeControl data-testid="first">First</TreeNodeControl>
      </TreeNode>
    );
    const secondTree = (
      <KeyboardTree>
        <TreeNode leaf onOpen={secondOpen}>
          <TreeNodeControl data-testid="second">Second</TreeNodeControl>
        </TreeNode>
      </KeyboardTree>
    );
    const view = renderInApp(
      <>
        <KeyboardTree>
          {firstNode}
          {nested && secondTree}
        </KeyboardTree>
        {!nested && secondTree}
      </>,
    );
    const first = view.getByTestId('first');
    const second = view.getByTestId('second');

    act(() => second.focus());
    await act(() => {
      fireEvent.keyDown(second, { key: 'Enter', code: 'Enter' });
    });
    expect(secondOpen).toHaveBeenCalledOnce();
    expect(firstOpen).not.toHaveBeenCalled();
    expect(second).toHaveFocus();

    act(() => first.focus());
    await act(() => {
      fireEvent.keyDown(first, { key: 'ArrowRight' });
    });
    expect(firstOpen).toHaveBeenCalledOnce();
    expect(secondOpen).toHaveBeenCalledOnce();
    expect(first).toHaveFocus();
  });

  it('attaches one action listener to the tree and removes it on unmount', () => {
    const addListener = vi.spyOn(HTMLElement.prototype, 'addEventListener');
    const removeListener = vi.spyOn(HTMLElement.prototype, 'removeEventListener');
    try {
      const { getByTestId, node, unmount } = setup();
      const tree = getByTestId('tree');
      const actionListeners = addListener.mock.calls.filter(
        ([type, , capture], index) => type === 'keydown' && capture === true && addListener.mock.contexts[index] === tree,
      );
      expect(actionListeners).toHaveLength(1);
      expect(addListener.mock.contexts).not.toContain(node);
      expect(addListener.mock.contexts).not.toContain(getByTestId('next'));

      unmount();
      expect(removeListener).toHaveBeenCalledWith(...actionListeners[0]!);
    } finally {
      addListener.mockRestore();
      removeListener.mockRestore();
    }
  });

  it.each([
    ['ArrowRight', false],
    ['ArrowLeft', true],
  ])('handles %s before list navigation', (key, expanded) => {
    const { node, expand, open } = setup({ expanded });
    fireEvent.keyDown(node, { key });
    expect(expand).toHaveBeenCalledOnce();
    expect(open).not.toHaveBeenCalled();
    expect(node).toHaveFocus();
  });

  it.each(['Enter', 'ArrowRight'])('opens a leaf with %s', key => {
    const { node, open, expand, select } = setup({ leaf: true });
    fireEvent.keyDown(node, { key, code: key });
    expect(open).toHaveBeenCalledOnce();
    expect(expand).not.toHaveBeenCalled();
    expect(select).not.toHaveBeenCalled();
    expect(node).toHaveFocus();
  });

  it.each([false, true])('toggles a branch with Enter when expanded is %s', expanded => {
    const { node, expand, open, select } = setup({ expanded });
    fireEvent.keyDown(node, { key: 'Enter', code: 'Enter' });
    expect(expand).toHaveBeenCalledOnce();
    expect(open).not.toHaveBeenCalled();
    expect(select).not.toHaveBeenCalled();
    expect(node).toHaveFocus();
  });

  it.each(['ArrowRight', 'ArrowDown'])('preserves list navigation for %s on an expanded node', key => {
    const { node, getByTestId, expand, open } = setup({ expanded: true });
    fireEvent.keyDown(node, { key });
    expect(getByTestId('next')).toHaveFocus();
    expect(expand).not.toHaveBeenCalled();
    expect(open).not.toHaveBeenCalled();
  });

  it.each([{ disabled: true }, { loading: true }])('does not execute unavailable actions: %o', props => {
    const { node, expand, open } = setup(props);
    fireEvent.keyDown(node, { key: 'ArrowRight' });
    fireEvent.keyDown(node, { key: 'Enter', code: 'Enter' });
    expect(expand).not.toHaveBeenCalled();
    expect(open).not.toHaveBeenCalled();
  });

  it('leaves keys in nested inputs to the input', () => {
    const { getByRole, expand, open, select } = setup();
    const input = getByRole('textbox');
    act(() => input.focus());
    fireEvent.keyDown(input, { key: 'ArrowRight' });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
    expect(expand).not.toHaveBeenCalled();
    expect(open).not.toHaveBeenCalled();
    expect(select).not.toHaveBeenCalled();
    expect(input).toHaveFocus();
  });

  it('does not handle hotkeys outside the focused node', () => {
    const { node, getByTestId, expand, open } = setup({ leaf: true });
    const next = getByTestId('next');
    act(() => next.focus());
    fireEvent.keyDown(next, { key: 'Enter', code: 'Enter' });
    expect(open).not.toHaveBeenCalled();
    expect(expand).not.toHaveBeenCalled();

    act(() => node.focus());
    fireEvent.keyDown(node, { key: 'Enter', code: 'Enter' });
    expect(open).toHaveBeenCalledOnce();
  });

  it('preserves modified Enter selection', () => {
    const { node, select, open } = setup();
    fireEvent.keyDown(node, { key: 'Enter', code: 'Enter', ctrlKey: true });
    expect(select).toHaveBeenCalledWith(true, undefined);
    expect(open).not.toHaveBeenCalled();
  });

  it('does not start another expansion while children are loading', () => {
    const { node, expand } = setup();
    fireEvent.keyDown(node, { key: 'ArrowRight', code: 'ArrowRight' });
    fireEvent.keyDown(node, { key: 'ArrowRight', code: 'ArrowRight', repeat: true });
    expect(expand).toHaveBeenCalledOnce();
    expect(node).toHaveFocus();
  });
});
