/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { forwardRef, useContext, useDeferredValue, useMemo } from 'react';
import styled from 'reshadow';

import { getComputed, TreeNodeNested, TreeNodeNestedMessage, TREE_NODE_STYLES, useTranslate } from '@cloudbeaver/core-blocks';
import { isArraysEqual } from '@cloudbeaver/core-utils';

import { ElementsTreeContext } from '../../ElementsTreeContext';
import type { NavTreeNodeComponent } from '../../NavigationNodeComponent';

interface Props {
  nodeId?: string;
  component: NavTreeNodeComponent;
  path: string[];
  root?: boolean;
  className?: string;
}

export const NavigationNodeNested = observer(forwardRef<HTMLDivElement, Props>(function NavigationNodeNested({
  nodeId,
  component,
  path,
  root,
  className,
}, ref) {
  const treeContext = useContext(ElementsTreeContext);
  const translate = useTranslate();

  const NavigationNode = component;
  const nextPath = useMemo(() => [...path, nodeId].filter((a): a is string => a !== undefined), [path, nodeId]);
  let children: string[] = [];
  let empty = true;
  let rootFolder = false;

  if (nodeId !== undefined) {
    rootFolder = getComputed(() => (
      !!root && treeContext?.folderExplorer.state.folder !== treeContext?.folderExplorer.root
    ));


    if (!rootFolder) {
      children = getComputed(
        () => treeContext?.tree.getNodeChildren(nodeId) || [],
        (a, b) => isArraysEqual(a, b, undefined, true));
      empty = getComputed(() => (
        children.length === 0 && (
          !treeContext?.tree.filtering
        || !!treeContext.tree.getNodeState(nodeId).showInFilter
        )
      ));
    }
  }

  children = useDeferredValue(children);
  empty = useDeferredValue(empty);

  if (nodeId !== undefined && rootFolder) {
    return styled(TREE_NODE_STYLES)(
      <NavigationNode nodeId={nodeId} path={path} expanded />
    );
  }

  return styled(TREE_NODE_STYLES)(
    <TreeNodeNested ref={ref} root={root} className={className}>
      {children.map(child => (
        <NavigationNode key={child} nodeId={child} path={nextPath} />
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
