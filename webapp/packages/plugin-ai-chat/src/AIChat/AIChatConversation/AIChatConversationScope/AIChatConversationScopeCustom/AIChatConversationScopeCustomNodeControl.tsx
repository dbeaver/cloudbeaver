/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { forwardRef, use } from 'react';
import { observer } from 'mobx-react-lite';

import { TreeNodeControl, TreeNodeSelect, TreeNodeExpand, TreeNodeIcon, TreeNodeName, TreeNodeContext } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { ENodeFeature, NavNodeInfoResource } from '@cloudbeaver/core-navigation-tree';
import { TreeContext, TreeDataContext, type NodeControlComponent } from '@cloudbeaver/plugin-navigation-tree';

const ENABLED_OBJECTS: ENodeFeature[] = [ENodeFeature.objectContainer, ENodeFeature.entity];

export const AIChatConversationScopeCustomNodeControl: NodeControlComponent = observer(
  forwardRef(function AIChatConversationScopeCustomNodeControl({ nodeId }, ref) {
    const data = use(TreeDataContext)!;
    const tree = use(TreeContext)!;
    const context = use(TreeNodeContext);
    const navNodeInfoResource = useService(NavNodeInfoResource);

    const node = data.getNode(nodeId);
    const height = tree.getNodeHeight(nodeId);
    const navNode = navNodeInfoResource.get(nodeId);

    if (!navNode) {
      return null;
    }

    const emptyFolder = !node.leaf && context.expanded && data.getChildren(nodeId).length === 0;
    const selected = data.getState(navNode.uri).selected;
    const disabled = emptyFolder || !navNode.objectFeatures?.some(f => ENABLED_OBJECTS.includes(f as ENodeFeature));

    return (
      <TreeNodeControl ref={ref} style={{ height }} className="tw:px-4! tw:min-w-0 tw:before:pointer-events-none" aria-selected={selected}>
        <TreeNodeSelect selected={selected} disabled={disabled} onSelect={() => tree.selectNode(navNode.uri, !selected)} />
        <TreeNodeExpand disabled={emptyFolder} leaf={node.leaf} />
        <TreeNodeIcon className="tw:w-4! tw:h-4! tw:mx-2!" icon={navNode.icon} />
        <TreeNodeName className="tw:justify-between tw:grow" title={navNode.name}>
          <div className="tw:flex tw:items-center tw:gap-1 tw:overflow-ellipsis tw:overflow-hidden  tw:grow">{navNode.name}</div>
        </TreeNodeName>
      </TreeNodeControl>
    );
  }),
);
