/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useContext, useId } from 'react';

import { getComputed, TreeNodeNested } from '@cloudbeaver/core-blocks';

import { NodeSizeCacheContext } from './contexts/NodeSizeCacheContext.js';
import { TreeDataContext } from './contexts/TreeDataContext.js';
import { TreeVirtualizationContext } from './contexts/TreeVirtualizationContext.js';
import type { NodeEmptyPlaceholderComponent } from './NodeEmptyPlaceholderComponent.js';
import { NodeRenderer } from './NodeRenderer.js';

interface Props {
  nodeId: string;
  emptyPlaceholder?: NodeEmptyPlaceholderComponent;
  offsetHeight: number;
  root?: boolean;
}

const OVERSCAN = 128;

function getPositionWithOverscan(position: number, forward: boolean) {
  if (forward) {
    return position - (position % OVERSCAN) + OVERSCAN;
  }

  return position - (position % OVERSCAN);
}

const NodeChildrenObserved = observer<Props>(function NodeChildren({ nodeId, emptyPlaceholder, offsetHeight, root }) {
  const data = useContext(TreeDataContext)!;
  const optimization = useContext(TreeVirtualizationContext)!;
  const sizeCache = useContext(NodeSizeCacheContext)!;
  const firstId = useId();
  const lastId = useId();
  const viewPortFrom = getComputed(() => getPositionWithOverscan(optimization.viewPort.from, false)) - offsetHeight;
  const viewPortTo = getComputed(() => getPositionWithOverscan(optimization.viewPort.to, true)) - offsetHeight;

  const children = data.getChildren(nodeId);

  function renderChildren() {
    let offset = 0;
    let postFillHeight = 0;

    const elements = [];

    for (let i = 0; i < children.length; i++) {
      const child = children[i]!;
      const size = sizeCache.getSize(child);

      if (offset + size < viewPortFrom) {
        offset += size;
      } else if (offset < viewPortTo) {
        if (offset > 0 && elements.length === 0) {
          elements.push(<div key={firstId} style={{ height: offset }} />);
        }

        elements.push(<NodeRenderer key={child} nodeId={child} offsetHeight={offset + offsetHeight} childrenRenderer={NodeChildrenObserved} />);
        offset += size;
      } else {
        postFillHeight += size;
      }
    }

    if (postFillHeight > 0) {
      elements.push(<div key={lastId} style={{ height: postFillHeight }} />);
    }

    if (elements.length === 0 && emptyPlaceholder) {
      const EmptyPlaceholder = emptyPlaceholder;
      elements.push(<EmptyPlaceholder key="empty" root={root} />);
    }

    return elements;
  }

  return <TreeNodeNested root={root}>{renderChildren()}</TreeNodeNested>;
});

export const NodeChildren = NodeChildrenObserved;
