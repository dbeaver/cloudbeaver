/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { act, createElement, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useTreeRovingFocus } from './useTreeRovingFocus.js';

interface IControl {
  id: string;
  selected?: boolean;
  nestedFocusable?: boolean;
}

describe('useTreeRovingFocus', () => {
  let container: HTMLDivElement;
  let root: Root;
  let focusNode: (nodeId: string) => Promise<void>;
  let outside: HTMLButtonElement;

  beforeEach(() => {
    container = document.createElement('div');
    outside = document.createElement('button');
    document.body.append(container, outside);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    outside.remove();
  });

  function Navigation({
    controls,
    isFocusable,
    revealNode,
  }: {
    controls: IControl[];
    isFocusable?: (nodeId: string) => boolean;
    revealNode?: (nodeId: string) => Promise<void> | void;
  }) {
    const rovingFocus = useTreeRovingFocus({ isFocusable, revealNode });
    focusNode = rovingFocus.focus;

    return createElement(
      'div',
      rovingFocus,
      controls.map(control =>
        createElement(
          'div',
          {
            key: control.id,
            'aria-selected': !!control.selected,
            'data-tree-node-control': true,
            'data-tree-node-id': control.id,
            tabIndex: control.selected ? 0 : -1,
          },
          control.nestedFocusable ? createElement('button') : null,
        ),
      ),
    );
  }

  it('uses the selected node as the only initial tab stop', async () => {
    await act(() => root.render(createElement(Navigation, { controls: [{ id: 'first' }, { id: 'selected', selected: true }] })));
    const controls = container.querySelectorAll<HTMLElement>('[data-tree-node-control]');

    expect(controls[0]?.tabIndex).toBe(-1);
    expect(controls[1]?.tabIndex).toBe(0);
  });

  it('uses the first node when no node is selected', async () => {
    await act(() => root.render(createElement(Navigation, { controls: [{ id: 'first' }, { id: 'second' }] })));
    const controls = container.querySelectorAll<HTMLElement>('[data-tree-node-control]');

    expect(controls[0]?.tabIndex).toBe(0);
    expect(controls[1]?.tabIndex).toBe(-1);
  });

  it('does not create a tab stop for nodes that cannot receive focus', async () => {
    await act(() =>
      root.render(
        createElement(Navigation, {
          controls: [{ id: 'structural', selected: true }, { id: 'focusable' }],
          isFocusable: nodeId => nodeId !== 'structural',
        }),
      ),
    );
    const controls = container.querySelectorAll<HTMLElement>('[data-tree-node-control]');

    expect(controls[0]?.tabIndex).toBe(-1);
    expect(controls[1]?.tabIndex).toBe(0);
  });

  it('moves focus and the tab stop together', async () => {
    await act(() => root.render(createElement(Navigation, { controls: [{ id: 'first' }, { id: 'second' }] })));

    await act(() => focusNode('second'));

    expect(document.activeElement?.getAttribute('data-tree-node-id')).toBe('second');
    expect(container.querySelector<HTMLElement>('[data-tree-node-id="first"]')?.tabIndex).toBe(-1);
    expect(container.querySelector<HTMLElement>('[data-tree-node-id="second"]')?.tabIndex).toBe(0);
  });

  it('removes the tree item tab stop while tabbing through its nested controls', async () => {
    await act(() => root.render(createElement(Navigation, { controls: [{ id: 'first' }, { id: 'second', nestedFocusable: true }] })));
    const second = container.querySelector<HTMLElement>('[data-tree-node-id="second"]')!;

    second.querySelector('button')!.focus();

    expect(container.querySelector<HTMLElement>('[data-tree-node-id="first"]')?.tabIndex).toBe(-1);
    expect(second.tabIndex).toBe(-1);

    outside.focus();

    expect(second.tabIndex).toBe(0);
  });

  it('focuses a node after reveal mounts it', async () => {
    function VirtualizedNavigation() {
      const [revealed, setRevealed] = useState(false);
      return createElement(Navigation, {
        controls: [{ id: 'first' }, ...(revealed ? [{ id: 'second' }] : [])],
        revealNode() {
          setRevealed(true);
        },
      });
    }

    await act(() => root.render(createElement(VirtualizedNavigation)));
    await act(() => focusNode('second'));

    expect(document.activeElement?.getAttribute('data-tree-node-id')).toBe('second');
  });

  it('keeps focus outside when an outdated reveal finishes', async () => {
    let finishReveal!: () => void;
    const reveal = new Promise<void>(resolve => {
      finishReveal = resolve;
    });

    function VirtualizedNavigation() {
      const [revealed, setRevealed] = useState(false);
      return createElement(Navigation, {
        controls: [{ id: 'first' }, ...(revealed ? [{ id: 'second' }] : [])],
        async revealNode() {
          await reveal;
          setRevealed(true);
        },
      });
    }

    await act(() => root.render(createElement(VirtualizedNavigation)));
    container.querySelector<HTMLElement>('[data-tree-node-id="first"]')?.focus();
    void focusNode('second');
    outside.focus();

    await act(async () => {
      finishReveal();
      await reveal;
    });

    expect(document.activeElement).toBe(outside);
  });

  it('moves focus to a fallback when the active node is removed', async () => {
    function MutableNavigation() {
      const [showFirst, setShowFirst] = useState(true);
      const rovingFocus = useTreeRovingFocus();
      focusNode = async nodeId => {
        if (nodeId === 'remove-first') {
          setShowFirst(false);
          return;
        }
        await rovingFocus.focus(nodeId);
      };

      return createElement(
        'div',
        rovingFocus,
        showFirst ? createElement('div', { 'data-tree-node-control': true, 'data-tree-node-id': 'first', tabIndex: 0 }) : null,
        createElement('div', { 'data-tree-node-control': true, 'data-tree-node-id': 'second', tabIndex: -1 }),
      );
    }

    await act(() => root.render(createElement(MutableNavigation)));
    container.querySelector<HTMLElement>('[data-tree-node-id="first"]')?.focus();
    await act(() => focusNode('remove-first'));

    await vi.waitFor(() => expect(document.activeElement?.getAttribute('data-tree-node-id')).toBe('second'));
  });
});
