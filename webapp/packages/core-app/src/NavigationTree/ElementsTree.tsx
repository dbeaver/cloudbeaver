/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useMemo } from 'react';
import styled, { css } from 'reshadow';

import { Loader, useMapResource } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import type { MetadataMap } from '@cloudbeaver/core-utils';

import type { NavNode } from '../shared/NodesManager/EntityTypes';
import { NavNodeInfoResource, ROOT_NODE_PATH } from '../shared/NodesManager/NavNodeInfoResource';
import { NavTreeResource } from '../shared/NodesManager/NavTreeResource';
import { useChildren } from '../shared/useChildren';
import { elementsTreeNameFilter } from './elementsTreeNameFilter';
import { NavigationNodeNested } from './NavigationTreeNode/NavigationNode/NavigationNodeNested';
import { NavigationNodeElement } from './NavigationTreeNode/NavigationNodeElement';
import { ITreeContext, TreeContext } from './TreeContext';
import { IElementsTreeCustomRenderer, IElementsTreeFilter, ITreeNodeState, useElementsTree } from './useElementsTree';

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

interface Props {
  root?: string;
  selectionTree?: boolean;
  localState?: MetadataMap<string, ITreeNodeState>;
  control?: React.FC<{
    node: NavNode;
  }>;
  emptyPlaceholder: React.FC;
  className?: string;
  filters?: IElementsTreeFilter[];
  renderers?: IElementsTreeCustomRenderer[];
  customSelect?: (node: NavNode, multiple: boolean) => void;
  isGroup?: (node: NavNode) => boolean;
  onExpand?: (node: NavNode, state: boolean) => Promise<void> | void;
  onOpen?: (node: NavNode) => Promise<void> | void;
  onSelect?: (node: NavNode, state: boolean) => void;
  onFilter?: (node: NavNode, value: string) => void;
}

export const ElementsTree: React.FC<Props> = observer(function ElementsTree({
  root = ROOT_NODE_PATH,
  control,
  localState,
  selectionTree = false,
  emptyPlaceholder,
  filters,
  renderers,
  className,
  isGroup,
  customSelect,
  onExpand,
  onOpen,
  onSelect,
  onFilter,
}) {
  const nodeChildren = useChildren(root);
  const Placeholder = emptyPlaceholder;
  const navNodeInfoResource = useService(NavNodeInfoResource);

  useMapResource(NavTreeResource, root);

  const nameFilter = useMemo(() => elementsTreeNameFilter(navNodeInfoResource), [navNodeInfoResource]);

  const tree = useElementsTree({
    root,
    localState,
    filters: [nameFilter, ...(filters || [])],
    renderers,
    isGroup,
    onFilter,
    customSelect,
    onExpand,
    onSelect,
  });

  const context = useMemo<ITreeContext>(
    () => ({
      tree,
      selectionTree,
      control,
      onOpen,
    }),
    [control, selectionTree, onOpen]
  );

  if (!nodeChildren.children || nodeChildren.children.length === 0) {
    if (nodeChildren.isLoading()) {
      return styled(styles)(
        <center>
          <Loader />
        </center>
      );
    }

    return <Placeholder />;
  }

  return styled(styles)(
    <TreeContext.Provider value={context}>
      <tree className={className}>
        <NavigationNodeNested nodeId={root} component={NavigationNodeElement} root />
        <Loader loading={nodeChildren.isLoading()} overlay />
      </tree>
    </TreeContext.Provider>
  );
});
