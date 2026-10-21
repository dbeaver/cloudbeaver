/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { forwardRef, use } from 'react';
import { observer } from 'mobx-react-lite';

import { TreeNodeSelect, TreeNodeControl, TreeNodeExpand, TreeNodeIcon, TreeNodeName, useTranslate } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { NavNodeInfoResource } from '@cloudbeaver/core-navigation-tree';
import { TreeContext, TreeDataContext, TreeSelectionContext, type NodeControlComponent } from '@cloudbeaver/plugin-navigation-tree';

import { isScopeObject } from './isScopeObject.js';

export const AiScopeNodeControl: NodeControlComponent = observer(
  forwardRef(function AiScopeNodeControl({ nodeId }, ref) {
    const data = use(TreeDataContext)!;
    const tree = use(TreeContext)!;
    const selection = use(TreeSelectionContext)!;
    const navNodeInfoResource = useService(NavNodeInfoResource);
    const translate = useTranslate();
    const node = navNodeInfoResource.get(nodeId)!;
    const { selected, indeterminate } = selection.getSelection(nodeId);
    const inherited = navNodeInfoResource.getParents(nodeId).some(parent => selection.isSelected(parent));
    const selectable = isScopeObject(node);
    const emptyFolder = !data.getNode(nodeId).leaf && data.getState(nodeId).expanded && data.getUnfilteredChildren(nodeId).length === 0;
    const disabled = !selectable || emptyFolder || inherited;

    return (
      <TreeNodeControl
        ref={ref}
        style={{ height: tree.getNodeHeight(nodeId) }}
        className="tw:px-4! tw:min-w-0 tw:before:pointer-events-none"
        tabIndex={-1}
      >
        <TreeNodeSelect
          aria-label={node.name || node.uri}
          selected={selectable && !emptyFolder && selected}
          indeterminate={selectable && indeterminate}
          disabled={disabled}
          title={disabled ? translate(inherited ? 'plugin_ai_scope_inherited' : 'plugin_ai_scope_folder') : undefined}
          onSelect={() => (selection.type === 'checkbox' ? selection.select(nodeId) : undefined)}
        />
        <TreeNodeExpand disabled={emptyFolder} leaf={data.getNode(nodeId).leaf} />
        <TreeNodeIcon className="tw:w-4! tw:h-4! tw:mx-2!" icon={node.icon} />
        <TreeNodeName className="tw:justify-between tw:grow" title={node.name}>
          <div className="tw:truncate tw:grow">{node.name}</div>
        </TreeNodeName>
      </TreeNodeControl>
    );
  }),
);
