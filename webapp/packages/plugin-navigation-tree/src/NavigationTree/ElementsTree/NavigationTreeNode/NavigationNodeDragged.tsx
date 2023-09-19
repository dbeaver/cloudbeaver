/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useContext } from 'react';

import { getComputed, s, TreeNode, useObjectRef, useS } from '@cloudbeaver/core-blocks';

import { ElementsTreeContext } from '../ElementsTreeContext';
import type { NavigationNodeComponent } from '../NavigationNodeComponent';
import { transformNodeInfo } from '../transformNodeInfo';
import { NavigationNodeControlLoader } from './NavigationNode/NavigationNodeLoaders';
import style from './NavigationNodeDragged.m.css';

export const NavigationNodeDragged: NavigationNodeComponent = observer(function NavigationNode({ node, className, control: externalControl }) {
  const styles = useS(style);
  const contextRef = useObjectRef({
    context: useContext(ElementsTreeContext),
  });
  const control = getComputed(() => contextRef.context?.control);

  const Control = control || externalControl || NavigationNodeControlLoader;
  const nodeInfo = transformNodeInfo(node, contextRef.context?.tree.nodeInfoTransformers ?? []);

  return (
    <TreeNode externalExpanded={false} className={s(styles, { treeNode: true }, className)} leaf>
      {/* <DNDPreview data={dndData} src="/icons/empty.svg" /> */}
      <Control nodeInfo={nodeInfo} node={node} dndPlaceholder />
    </TreeNode>
  );
});
