/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';

import { TreeNode } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { DNDPreview, useDNDData } from '@cloudbeaver/core-ui';
import { useDataContext } from '@cloudbeaver/core-view';

import { DATA_CONTEXT_NAV_NODE } from '../../../shared/NodesManager/DATA_CONTEXT_NAV_NODE';
import { DATA_CONTEXT_NAV_NODES } from '../../../shared/NodesManager/DATA_CONTEXT_NAV_NODES';
import { NavNodeManagerService } from '../../../shared/NodesManager/NavNodeManagerService';
import type { NavigationNodeComponent } from '../NavigationNodeComponent';
import { NavigationNodeControl } from './NavigationNode/NavigationNodeControl';
import { NavigationNodeNested } from './NavigationNode/NavigationNodeNested';
import { useNavigationNode } from './useNavigationNode';

export const NavigationNode: NavigationNodeComponent = observer(function NavigationNode({
  node,
  component,
  path,
  expanded: expandedExternal,
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
    handleClick,
    handleExpand,
    handleOpen,
    handleSelect,
    getSelected,
  } = useNavigationNode(node, path);
  const context = useDataContext();
  const dndData = useDNDData(context, {
    onDragStart: async () => {
      // strange way to preload alias while dragging
      await navNodeManagerService.getNodeDatabaseAlias(node.id);
    },
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

  return (
    <TreeNode
      group={group}
      loading={loading}
      disabled={disabled}
      selected={selected}
      indeterminateSelected={indeterminateSelected}
      expanded={expanded}
      showInFilter={showInFilter}
      externalExpanded={expandedExternal}
      leaf={leaf}
      onExpand={handleExpand}
      onClick={handleClick}
      onOpen={handleOpen}
      onSelect={handleSelect}
    >
      {/* <DNDPreview data={dndData} src="/icons/empty.svg" /> */}
      <Control ref={setRef} dragging={dndData.state.isDragging} node={node} />
      {(expanded || expandedExternal) && <NavigationNodeNested nodeId={node.id} path={path} component={component} />}
    </TreeNode>
  );
});
