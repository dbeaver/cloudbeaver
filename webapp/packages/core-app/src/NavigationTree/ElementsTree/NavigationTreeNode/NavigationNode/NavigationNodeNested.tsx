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
import { useStyles } from '@cloudbeaver/core-theming';

import type { NavTreeNodeComponent } from '../../NavigationNodeComponent';
import { TreeContext } from '../../TreeContext';

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
  const styles = useStyles(TREE_NODE_STYLES);
  const treeContext = useContext(TreeContext);
  const translate = useTranslate();

  const nextPath = useMemo(() => [...path, nodeId], [path, nodeId]);
  const children = getComputed(
    () => treeContext?.tree.getNodeChildren(nodeId) || []
  );

  const NavigationNode = component;

  if (root) {
    if (treeContext?.folderExplorer.folder !== treeContext?.folderExplorer.root) {
      return styled(styles)(
        <NavigationNode nodeId={nodeId} path={path} expanded />
      );
    }
  }

  return styled(styles)(
    <TreeNodeNested root={root}>
      {children.map(child => <NavigationNode key={child} nodeId={child} path={nextPath} />)}
      {children.length === 0 && <TreeNodeNestedMessage>{translate('app_navigationTree_node_empty')}</TreeNodeNestedMessage>}
    </TreeNodeNested>
  );
});
