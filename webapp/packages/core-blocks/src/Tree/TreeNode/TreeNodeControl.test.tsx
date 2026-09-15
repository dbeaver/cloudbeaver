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
import { TreeNode } from './TreeNode.js';
import { TreeNodeControl } from './TreeNodeControl.js';

function setup(props: { expanded?: boolean; leaf?: boolean; disabled?: boolean; loading?: boolean } = {}) {
  const expand = vi.fn();
  const open = vi.fn();
  const select = vi.fn();

  function Tree() {
    const ref = useListKeyboardNavigation('[data-tree-node-control]');
    return (
      <div ref={ref}>
        <TreeNode {...props} selected onExpand={expand} onOpen={open} onSelect={select}>
          <TreeNodeControl data-testid="node">
            Node
            <input aria-label="Rename" />
          </TreeNodeControl>
        </TreeNode>
        <TreeNode>
          <TreeNodeControl data-testid="next">Next</TreeNodeControl>
        </TreeNode>
      </div>
    );
  }

  const view = renderInApp(<Tree />);
  const node = view.getByTestId('node');
  act(() => node.focus());
  return { ...view, node, expand, open, select };
}

describe('Tree keyboard actions', () => {
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
