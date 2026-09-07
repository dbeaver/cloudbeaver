/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { act, createElement, useContext, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { TreeNode, TreeNodeContext, TreeNodeControl } from '@cloudbeaver/core-blocks';

import { type ITreeKeyboardNavigationOptions, useTreeKeyboardNavigation } from './useTreeKeyboardNavigation.js';

function createOptions(): ITreeKeyboardNavigationOptions {
  return {
    getParent: nodeId => (nodeId === 'child' ? 'parent' : null),
    getChildren: nodeId => (nodeId === 'parent' ? ['child'] : []),
    isExpanded: () => false,
    isLeaf: nodeId => nodeId === 'child',
    setExpanded: vi.fn(),
    activateNode: vi.fn(),
  };
}

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

  async function renderNavigation(options: ITreeKeyboardNavigationOptions, nodeId = 'parent', onKeyDown?: () => void) {
    function Navigation() {
      const handlers = useTreeKeyboardNavigation(options);
      return createElement(
        'div',
        handlers,
        createElement('div', {
          'data-tree-node-control': true,
          'data-tree-node-id': nodeId,
          onKeyDown,
          tabIndex: 0,
        }),
      );
    }

    await act(() => root.render(createElement(Navigation)));
    return container.querySelector<HTMLElement>('[data-tree-node-control]')!;
  }

  it('toggles an expandable branch on Enter', async () => {
    const options = createOptions();
    const control = await renderNavigation(options);

    control.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'Enter' }));

    expect(options.setExpanded).toHaveBeenCalledWith('parent', true);
    expect(options.activateNode).not.toHaveBeenCalled();
  });

  it('activates a leaf on Enter without swallowing its selection handler', async () => {
    const options = createOptions();
    const onKeyDown = vi.fn();
    const control = await renderNavigation(options, 'child', onKeyDown);

    control.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'Enter' }));

    expect(options.activateNode).toHaveBeenCalledWith('child');
    expect(onKeyDown).toHaveBeenCalledOnce();
  });

  it('consumes arrow keys at tree boundaries', async () => {
    const onKeyDown = vi.fn();
    const control = await renderNavigation(createOptions(), 'parent', onKeyDown);
    const event = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'ArrowUp' });

    control.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
    expect(onKeyDown).not.toHaveBeenCalled();
  });

  it('does not handle keys when navigation is disabled', async () => {
    const options = createOptions();
    options.disabled = true;
    const control = await renderNavigation(options);

    control.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'ArrowRight' }));

    expect(options.setExpanded).not.toHaveBeenCalled();
  });

  it.each([{ altKey: true }, { ctrlKey: true }, { metaKey: true }])('does not handle modified arrow keys (%o)', async modifiers => {
    const options = createOptions();
    const control = await renderNavigation(options);
    const event = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'ArrowRight', ...modifiers });

    control.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(false);
    expect(options.setExpanded).not.toHaveBeenCalled();
  });

  it('keeps the treeitem role, state, and tab stop on the focused element', async () => {
    const options = createOptions();
    const actions: string[] = [];
    const onSelect = vi.fn(() => {
      actions.push('select');
    });
    vi.mocked(options.activateNode!).mockImplementation(() => {
      actions.push('activate');
    });

    function Navigation() {
      const handlers = useTreeKeyboardNavigation(options);
      return createElement(
        'div',
        handlers,
        createElement(TreeNode, { nodeId: 'child', selected: true, leaf: true, onSelect }, createElement(TreeNodeControl)),
      );
    }

    await act(() => root.render(createElement(Navigation)));
    const treeItem = container.querySelector<HTMLElement>('[role="treeitem"]')!;

    expect(treeItem.matches('[data-tree-node-control][data-tree-node-id="child"]')).toBe(true);
    expect(treeItem.tabIndex).toBe(0);
    expect(treeItem.getAttribute('aria-selected')).toBe('true');
    expect(treeItem.hasAttribute('aria-expanded')).toBe(false);
    expect(treeItem.firstElementChild?.hasAttribute('tabindex')).toBe(false);
    expect(treeItem.firstElementChild?.getAttribute('data-selected')).toBe('true');
    expect(treeItem.firstElementChild?.hasAttribute('data-tree-node-content')).toBe(true);

    treeItem.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'Enter', code: 'Enter' }));

    expect(options.activateNode).toHaveBeenCalledWith('child');
    expect(onSelect).toHaveBeenCalledOnce();
    expect(actions).toEqual(['select', 'activate']);
  });

  it('keeps the selected control highlighted after a click', async () => {
    function Control() {
      const context = useContext(TreeNodeContext);
      return createElement(TreeNodeControl, { onClick: () => context.select() });
    }

    function SelectableNode() {
      const [selected, setSelected] = useState(false);
      return createElement(TreeNode, { nodeId: 'node', selected, leaf: true, onSelect: () => setSelected(true) }, createElement(Control));
    }

    await act(() => root.render(createElement(SelectableNode)));
    const control = container.querySelector<HTMLElement>('[data-selected="false"]')!;

    await act(() => control.dispatchEvent(new MouseEvent('click', { bubbles: true })));

    expect(control.getAttribute('data-selected')).toBe('true');
    expect(container.querySelector('[role="treeitem"]')?.getAttribute('aria-selected')).toBe('true');
  });

  it('starts only one expansion while ArrowRight is held', async () => {
    const options = createOptions();
    const control = await renderNavigation(options);

    control.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'ArrowRight' }));
    for (let i = 0; i < 5; i++) {
      control.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'ArrowRight', repeat: true }));
    }

    expect(options.setExpanded).toHaveBeenCalledOnce();
  });

  it('does not start another expansion while the first one is pending', async () => {
    const options = createOptions();
    let finishExpansion!: () => void;
    const expansion = new Promise<void>(resolve => {
      finishExpansion = resolve;
    });
    vi.mocked(options.setExpanded).mockReturnValue(expansion);
    const control = await renderNavigation(options);

    control.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'ArrowRight' }));
    control.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'ArrowRight' }));

    expect(options.setExpanded).toHaveBeenCalledOnce();
    await act(() => finishExpansion());
  });
});
