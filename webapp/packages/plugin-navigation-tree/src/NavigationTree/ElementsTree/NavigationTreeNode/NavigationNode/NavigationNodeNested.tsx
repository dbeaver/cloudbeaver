/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { forwardRef, useContext, useMemo } from 'react';
import styled from 'reshadow';

import { getComputed, TreeNodeNested, TreeNodeNestedMessage, TREE_NODE_STYLES } from '@cloudbeaver/core-blocks';
import { useTranslate } from '@cloudbeaver/core-localization';

import { ElementsTreeContext } from '../../ElementsTreeContext';
import type { NavTreeNodeComponent } from '../../NavigationNodeComponent';

interface Props {
  nodeId?: string;
  component: NavTreeNodeComponent;
  path: string[];
  dndNodes?: string[];
  root?: boolean;
  className?: string;
}

export const NavigationNodeNested = observer(forwardRef<HTMLDivElement, Props>(function NavigationNodeNested({
  nodeId,
  component,
  path,
  dndNodes,
  root,
  className,
}, ref) {
  const treeContext = useContext(ElementsTreeContext);
  const translate = useTranslate();

  const NavigationNode = component;
  const nextPath = useMemo(() => [...path, nodeId ?? ''], [path, nodeId]);
  const children: string[] = [...(dndNodes || [])];
  let empty = true;

  if (nodeId !== undefined) {
    children.push(...getComputed(
      () => treeContext?.tree.getNodeChildren(nodeId) || []
    ));

    const state = getComputed(
      () => treeContext?.tree.getNodeState(nodeId)
    );

    if (root) {
      const rootFolder = getComputed(() => (
        treeContext?.folderExplorer.state.folder !== treeContext?.folderExplorer.root
      ));

      if (rootFolder) {
        return styled(TREE_NODE_STYLES)(
          <NavigationNode nodeId={nodeId} path={path} expanded />
        );
      }
    }

    empty = getComputed(() => (
      children.length === 0 && (
        !treeContext?.tree.filtering
        || !!state?.showInFilter
      )
    ));
  } else {
    empty = children.length === 0;
  }

  return styled(TREE_NODE_STYLES)(
    <TreeNodeNested ref={ref} root={root} className={className}>
      {children.map(child => (
        <NavigationNode
          key={child}
          nodeId={child}
          path={nextPath}
          dragging={dndNodes?.includes(child)}
          expanded={dndNodes?.includes(child) === true ? false : undefined}
        />
      ))}
      {empty && (
        <TreeNodeNestedMessage>
          {translate(
            nodeId === undefined
              ? 'app_navigationTree_connection_group_user'
              : 'app_navigationTree_node_empty'
          )}
        </TreeNodeNestedMessage>
      )}
    </TreeNodeNested>
  );
}));
