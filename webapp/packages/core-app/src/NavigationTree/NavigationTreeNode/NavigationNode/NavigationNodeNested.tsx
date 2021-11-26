/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { computed } from 'mobx';
import { observer } from 'mobx-react-lite';
import { useContext, useMemo } from 'react';
import styled from 'reshadow';

import { TreeNodeNested, TREE_NODE_STYLES } from '@cloudbeaver/core-blocks';
import { useStyles } from '@cloudbeaver/core-theming';

import type { NavTreeNodeComponent } from '../../NavigationNodeComponent';
import { TreeContext } from '../../TreeContext';

interface Props {
  nodeId: string;
  component: NavTreeNodeComponent;
  root?: boolean;
}

export const NavigationNodeNested = observer<Props>(function NavigationNodeNested({
  nodeId,
  component,
  root,
}) {
  const styles = useStyles(TREE_NODE_STYLES);
  const treeContext = useContext(TreeContext);

  const children = useMemo(
    () => computed(() => treeContext?.tree.getNodeChildren(nodeId) || []),
    [nodeId, treeContext?.tree]
  ).get();

  const NavigationNode = component;

  if (root) {
    if (treeContext?.folderExplorer.folder !== treeContext?.folderExplorer.root) {
      return styled(styles)(
        <NavigationNode nodeId={nodeId} expanded />
      );
    }

    return styled(styles)(
      <>
        {children.map(child => <NavigationNode key={child} nodeId={child} />)}
      </>
    );
  }

  return styled(styles)(
    <TreeNodeNested>
      {children.map(child => <NavigationNode key={child} nodeId={child} />)}
    </TreeNodeNested>
  );
});
