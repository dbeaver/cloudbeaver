/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useCallback, useMemo, useState } from 'react';
import styled, { css } from 'reshadow';

import { Loader } from '@cloudbeaver/core-blocks';
import { MetadataMap } from '@cloudbeaver/core-utils';

import type { NavNode } from '../shared/NodesManager/EntityTypes';
import { useChildren } from '../shared/useChildren';
import { NavigationNodeElement } from './NavigationTreeNode/NavigationNodeElement';
import { ITreeContext, TreeContext } from './TreeContext';

const styles = css`
  tree {
    position: relative;
    box-sizing: border-box;
  }

  center {
    display: flex;
    height: 100%;
    width: 100%;
    min-width: 240px;
  }
`;

export interface INodeState {
  filter: string;
}

interface Props {
  root?: string;
  selectionTree?: boolean;
  localState?: MetadataMap<string, INodeState>;
  control?: React.FC<{
    node: NavNode;
  }>;
  emptyPlaceholder: React.FC;
  className?: string;
  onOpen?: (node: NavNode) => Promise<void> | void;
  onSelect?: (node: NavNode, multiple: boolean) => void;
  isSelected?: (node: NavNode) => boolean;
  onFilter?: (node: NavNode, value: string) => void;
}

export const ElementsTree: React.FC<Props> = observer(function ElementsTree({
  root,
  control,
  localState,
  selectionTree = false,
  emptyPlaceholder,
  className,
  onOpen,
  onSelect,
  isSelected,
  onFilter,
}) {
  const nodeChildren = useChildren(root);
  const Placeholder = emptyPlaceholder;
  const [state] = useState(() => new MetadataMap<string, INodeState>(() => ({ filter: '' })));

  const elementsTreeState = localState || state;

  const getMetadata = useCallback((node: NavNode) => elementsTreeState.get(node.id), [elementsTreeState]);

  const onFilterHandler = useCallback((node: NavNode, value: string) => {
    elementsTreeState.get(node.id).filter = value;

    if (onFilter) {
      onFilter(node, value);
    }
  }, [elementsTreeState, onFilter]);

  const context = useMemo<ITreeContext>(
    () => ({
      state: elementsTreeState,
      getMetadata,
      selectionTree,
      control,
      onOpen,
      onSelect,
      isSelected,
      onFilter: onFilterHandler,
    }),
    [control, selectionTree, onOpen, onSelect, isSelected, onFilterHandler, elementsTreeState, getMetadata]
  );

  if (!nodeChildren.children || nodeChildren.children.length === 0) {
    if (nodeChildren.isLoading()) {
      return styled(styles)(
        <center as="div">
          <Loader />
        </center>
      );
    }

    return <Placeholder />;
  }

  return styled(styles)(
    <TreeContext.Provider value={context}>
      <tree as="div" className={className}>
        {nodeChildren.children.map(id => (
          <NavigationNodeElement key={id} nodeId={id} />
        ))}
        <Loader loading={nodeChildren.isLoading()} overlay />
      </tree>
    </TreeContext.Provider>
  );
});
