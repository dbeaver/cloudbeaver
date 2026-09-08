/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { describe, expect, it } from 'vitest';

import { getTreeKeyboardAction, type ITreeKeyboardNavigationModel } from './treeKeyboardNavigation.js';

const children: Record<string, string[]> = {
  root: ['parent', 'sibling'],
  parent: ['child', 'child-2'],
  child: [],
  'child-2': [],
  sibling: [],
};
const parents: Record<string, string | null> = {
  root: null,
  parent: 'root',
  child: 'parent',
  'child-2': 'parent',
  sibling: 'root',
};

function createModel(expanded: string[] = []): ITreeKeyboardNavigationModel {
  return {
    rootId: 'root',
    getParent: nodeId => parents[nodeId] ?? null,
    getChildren: nodeId => children[nodeId] ?? [],
    isExpanded: nodeId => expanded.includes(nodeId),
    isLeaf: nodeId => children[nodeId]?.length === 0,
    isFocusable: nodeId => nodeId !== 'root',
  };
}

describe('getTreeKeyboardAction', () => {
  it('moves down through visible nodes without wrapping', () => {
    const model = createModel(['parent']);

    expect(getTreeKeyboardAction(model, 'parent', 'ArrowDown')).toEqual({ type: 'focus', nodeId: 'child' });
    expect(getTreeKeyboardAction(model, 'child-2', 'ArrowDown')).toEqual({ type: 'focus', nodeId: 'sibling' });
    expect(getTreeKeyboardAction(model, 'sibling', 'ArrowDown')).toBeNull();
  });

  it('moves up to the parent or deepest visible node of the previous branch', () => {
    const model = createModel(['parent']);

    expect(getTreeKeyboardAction(model, 'child', 'ArrowUp')).toEqual({ type: 'focus', nodeId: 'parent' });
    expect(getTreeKeyboardAction(model, 'sibling', 'ArrowUp')).toEqual({ type: 'focus', nodeId: 'child-2' });
    expect(getTreeKeyboardAction(model, 'parent', 'ArrowUp')).toBeNull();
  });

  it('traverses expanded structural nodes that cannot receive focus', () => {
    const model = createModel(['parent']);
    model.getChildren = nodeId => {
      if (nodeId === 'root') {
        return ['parent', 'section', 'sibling'];
      }
      if (nodeId === 'section') {
        return ['section-child'];
      }
      return children[nodeId] ?? [];
    };
    model.getParent = nodeId => {
      if (nodeId === 'section-child') {
        return 'section';
      }
      if (nodeId === 'section') {
        return 'root';
      }
      return parents[nodeId] ?? null;
    };
    model.isExpanded = nodeId => nodeId === 'parent' || nodeId === 'section';
    model.isFocusable = nodeId => nodeId !== 'root' && nodeId !== 'section';

    expect(getTreeKeyboardAction(model, 'child-2', 'ArrowDown')).toEqual({ type: 'focus', nodeId: 'section-child' });
    expect(getTreeKeyboardAction(model, 'section-child', 'ArrowDown')).toEqual({ type: 'focus', nodeId: 'sibling' });
  });

  it('expands or enters a branch and activates a leaf with ArrowRight', () => {
    expect(getTreeKeyboardAction(createModel(), 'parent', 'ArrowRight')).toEqual({ type: 'expand', expanded: true });
    expect(getTreeKeyboardAction(createModel(['parent']), 'parent', 'ArrowRight')).toEqual({ type: 'focus', nodeId: 'child' });
    expect(getTreeKeyboardAction(createModel(), 'child', 'ArrowRight')).toEqual({ type: 'activate' });
  });

  it('does not leave an expanded branch without focusable descendants with ArrowRight', () => {
    const model = createModel(['parent']);
    model.isFocusable = nodeId => nodeId !== 'root' && !nodeId.startsWith('child');

    expect(getTreeKeyboardAction(model, 'parent', 'ArrowRight')).toBeNull();
  });

  it('collapses a branch or returns to its parent with ArrowLeft', () => {
    expect(getTreeKeyboardAction(createModel(['parent']), 'parent', 'ArrowLeft')).toEqual({ type: 'expand', expanded: false });
    expect(getTreeKeyboardAction(createModel(['parent']), 'child', 'ArrowLeft')).toEqual({ type: 'focus', nodeId: 'parent' });
  });

  it('moves to the first and last visible node with Home and End', () => {
    const model = createModel(['parent']);

    expect(getTreeKeyboardAction(model, 'child', 'Home')).toEqual({ type: 'focus', nodeId: 'parent' });
    expect(getTreeKeyboardAction(model, 'child', 'End')).toEqual({ type: 'focus', nodeId: 'sibling' });
  });

  it('ignores unrelated keys', () => {
    expect(getTreeKeyboardAction(createModel(), 'parent', 'Escape')).toBeNull();
  });
});
