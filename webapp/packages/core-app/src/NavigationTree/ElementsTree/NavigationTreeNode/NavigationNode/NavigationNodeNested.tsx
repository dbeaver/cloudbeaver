/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useContext, useMemo } from 'react';
import styled from 'reshadow';

import { getComputed, TreeNodeNested, TreeNodeNestedMessage, TREE_NODE_STYLES } from '@cloudbeaver/core-blocks';
import { useTranslate } from '@cloudbeaver/core-localization';

import { ElementsTreeContext } from '../../ElementsTreeContext';
import type { NavTreeNodeComponent } from '../../NavigationNodeComponent';

interface Props {
  nodeId: string;
  component: NavTreeNodeComponent;
  path: string[];
  root?: boolean;
}

export const NavigationNodeNested = observer<Props>(function NavigationNodeNested({
  nodeId,
  component,
  path,
  root,
}) {
  const treeContext = useContext(ElementsTreeContext);
  const translate = useTranslate();

  const nextPath = useMemo(() => [...path, nodeId], [path, nodeId]);
  const children = getComputed(
    () => treeContext?.tree.getNodeChildren(nodeId) || []
  );

  const state = getComputed(
    () => treeContext?.tree.getNodeState(nodeId)
  );

  const NavigationNode = component;

  if (root) {
    const rootFolder = getComputed(() => treeContext?.folderExplorer.state.folder !== treeContext?.folderExplorer.root);

    if (rootFolder) {
      return styled(TREE_NODE_STYLES)(
        <NavigationNode nodeId={nodeId} path={path} expanded />
      );
    }
  }

  const empty = getComputed(() => (
    children.length === 0 && (
      !treeContext?.tree.filtering
      || state?.showInFilter
    )
  ));

  return styled(TREE_NODE_STYLES)(
    <TreeNodeNested root={root}>
      {children.map(child => <NavigationNode key={child} nodeId={child} path={nextPath} />)}
      {empty && <TreeNodeNestedMessage>{translate('app_navigationTree_node_empty')}</TreeNodeNestedMessage>}
    </TreeNodeNested>
  );
});
