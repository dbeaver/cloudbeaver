/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';

import { getComputed, TreeNode, useStateDelay } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { useDNDData } from '@cloudbeaver/core-ui';
import {  useDataContext } from '@cloudbeaver/core-view';

import { DATA_CONTEXT_NAV_NODE } from '../../../shared/NodesManager/DATA_CONTEXT_NAV_NODE';
import { DATA_CONTEXT_NAV_NODES } from '../../../shared/NodesManager/DATA_CONTEXT_NAV_NODES';
import { getNodesFromContext } from '../../../shared/NodesManager/getNodesFromContext';
import { NavNodeManagerService } from '../../../shared/NodesManager/NavNodeManagerService';
import { useNavTreeDropBox } from '../../useNavTreeDropBox';
import type { NavigationNodeComponent } from '../NavigationNodeComponent';
import { NavigationNodeControl } from './NavigationNode/NavigationNodeControl';
import { NavigationNodeNested } from './NavigationNode/NavigationNodeNested';
import { useNavigationNode } from './useNavigationNode';

export const NavigationNode: NavigationNodeComponent = observer(function NavigationNode({
  node,
  component,
  path,
  expanded: expandedExternal,
  className,
}) {
  const navNodeManagerService = useService(NavNodeManagerService);
  const {
    ref,
    empty,
    group,
    control,
    disabled,
    selected,
    indeterminateSelected,
    loading,
    showInFilter,
    expanded,
    leaf,
    click,
    expand,
    open,
    select,
    getSelected,
  } = useNavigationNode(node, path);
  const context = useDataContext();
  const dndData = useDNDData(context, {
    onDragStart: async () => {
      if (!selected) {
        select(false);
      }

      // strange way to preload alias while dragging
      await navNodeManagerService.getNodeDatabaseAlias(node.id);
    },
  });
  const dndBox = useNavTreeDropBox(node, {
    expanded,
    expand,
  });


  context.set(DATA_CONTEXT_NAV_NODE, node);
  context.set(DATA_CONTEXT_NAV_NODES, getSelected);

  const Control = control || NavigationNodeControl;

  if (leaf || empty) {
    expandedExternal = false;
  }

  function setRef(refObj: HTMLDivElement  | null) {
    //@ts-expect-error ignore
    ref.current = refObj;
    dndData.setTargetRef(refObj);
  }

  let dndNodes: string[] = [];
  let hasNodes = getComputed(() => !!dndBox.state.context && dndBox.state.canDrop && dndBox.state.isOverCurrent);
  hasNodes = useStateDelay(hasNodes, 100);

  if (dndBox.state.context && hasNodes) {
    dndNodes = getNodesFromContext(dndBox.state.context)
      .map(node => node.id);

    expandedExternal = true;
  }

  return (
    <TreeNode
      ref={dndBox.setRef}
      group={group}
      loading={loading}
      disabled={disabled}
      selected={selected}
      indeterminateSelected={indeterminateSelected}
      expanded={expanded}
      showInFilter={showInFilter}
      externalExpanded={expandedExternal}
      leaf={leaf}
      className={className}
      onExpand={expand}
      onClick={click}
      onOpen={open}
      onSelect={select}
    >
      {/* <DNDPreview data={dndData} src="/icons/empty.svg" /> */}
      <Control
        ref={setRef}
        dndElement={dndData.state.isDragging}
        node={node}
      />
      {(expanded || expandedExternal) && (
        <NavigationNodeNested
          nodeId={node.id}
          path={path}
          dndNodes={dndNodes}
          component={component}
        />
      )}
    </TreeNode>
  );
});