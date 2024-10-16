/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useContext } from 'react';

import { getComputed, TreeNode, useObjectRef } from '@cloudbeaver/core-blocks';

import { ElementsTreeContext } from '../ElementsTreeContext.js';
import type { NavigationNodeComponent } from '../NavigationNodeComponent.js';
import { transformNodeInfo } from '../transformNodeInfo.js';
import { NavigationNodeControlLoader } from './NavigationNode/NavigationNodeLoaders.js';

export const NavigationNodeDragged: NavigationNodeComponent = observer(function NavigationNodeDragged({ node, className, control: externalControl }) {
  const contextRef = useObjectRef({
    context: useContext(ElementsTreeContext),
  });
  const control = getComputed(() => contextRef.context?.control);

  const Control = control || externalControl || NavigationNodeControlLoader;
  const nodeInfo = transformNodeInfo(node, contextRef.context?.tree.nodeInfoTransformers ?? []);

  return (
    <TreeNode externalExpanded={false} className={className} leaf>
      {/* <DNDPreview data={dndData} src="/icons/empty.svg" /> */}
      <Control nodeInfo={nodeInfo} node={node} dndPlaceholder />
    </TreeNode>
  );
});
