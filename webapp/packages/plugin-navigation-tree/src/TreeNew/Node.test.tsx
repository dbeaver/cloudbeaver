/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { TreeNodeControl } from '@cloudbeaver/core-blocks';

import type { ITreeData } from './ITreeData.js';
import { Node } from './Node.js';
import { Tree } from './Tree.js';

vi.mock('./useNodeDnD.js', () => ({
  useNodeDnD: () => ({
    state: { isDragging: false, isOverCurrent: false, canDrop: false },
    setRef: () => {},
  }),
}));

afterEach(cleanup);

describe('TreeNew keyboard actions', () => {
  it.each(['Enter', 'ArrowRight'])('opens a leaf with %s instead of expanding or selecting it', async key => {
    const open = vi.fn();
    const data: ITreeData = {
      rootId: 'root',
      getNode: () => ({ name: 'Leaf', leaf: true }),
      getState: () => ({ selected: true, expanded: false }),
      getChildren: id => (id === 'root' ? ['leaf'] : []),
      getUnfilteredChildren: id => (id === 'root' ? ['leaf'] : []),
      getParent: () => null,
      updateAllState: vi.fn(),
      updateState: vi.fn(),
      load: vi.fn(async () => {}),
      update: vi.fn(async () => {}),
    };
    const view = render(
      <Tree
        data={data}
        getNodeHeight={() => 24}
        nodeRenderers={[
          () => props => (
            <Node
              {...props}
              controlRenderer={({ ref }) => (
                <TreeNodeControl ref={ref} data-testid="leaf">
                  Leaf
                </TreeNodeControl>
              )}
            />
          ),
        ]}
        onNodeDoubleClick={open}
      />,
    );
    const node = view.getByTestId('leaf');
    act(() => node.focus());

    await act(() => {
      fireEvent.keyDown(node, { key, code: key });
    });

    expect(open).toHaveBeenCalledExactlyOnceWith('leaf');
    expect(data.updateState).not.toHaveBeenCalled();
    expect(data.load).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(node);
  });
});
