/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useContext } from 'react';

import { getComputed, TreeNode, useObjectRef } from '@cloudbeaver/core-blocks';

import { ElementsTreeContext } from '../ElementsTreeContext';
import type { NavigationNodeComponent } from '../NavigationNodeComponent';
import { NavigationNodeControl } from './NavigationNode/NavigationNodeControl';

export const NavigationNodeDragged: NavigationNodeComponent = observer(function NavigationNode({
  node,
  className,
}) {
  const contextRef = useObjectRef({
    context: useContext(ElementsTreeContext),
  });
  const control = getComputed(() => contextRef.context?.control);

  const Control = control || NavigationNodeControl;

  return (
    <TreeNode externalExpanded={false} className={className} leaf>
      {/* <DNDPreview data={dndData} src="/icons/empty.svg" /> */}
      <Control node={node} dndPlaceholder />
    </TreeNode>
  );
});