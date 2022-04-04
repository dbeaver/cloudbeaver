/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import React, { useContext, useState } from 'react';
import styled, { css, use } from 'reshadow';

import { ConnectionMark, getComputed, TreeNodeContext, TreeNodeControl, TreeNodeExpand, TreeNodeIcon, TreeNodeName, TREE_NODE_STYLES, useObjectRef } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { EventContext, EventStopPropagationFlag } from '@cloudbeaver/core-events';

import { EObjectFeature } from '../../../../shared/NodesManager/EObjectFeature';
import type { INodeActions } from '../../../../shared/NodesManager/INodeActions';
import { NavNodeInfoResource } from '../../../../shared/NodesManager/NavNodeInfoResource';
import { NavTreeResource } from '../../../../shared/NodesManager/NavTreeResource';
import { ElementsTreeContext } from '../../ElementsTreeContext';
import type { NavTreeControlComponent, NavTreeControlProps } from '../../NavigationNodeComponent';
import { TreeNodeMenu } from '../TreeNodeMenu/TreeNodeMenu';
import { NavigationNodeEditor } from './NavigationNodeEditor';

const styles = css`
  TreeNodeControl {
    opacity: 1;
    transition: opacity 0.2s ease;

    &[|outdated] {
      opacity: 0.5;
    }
  }
  TreeNodeControl:hover > portal, 
  TreeNodeControl:global([aria-selected=true]) > portal,
  portal:focus-within {
    visibility: visible;
  }
  portal {
    position: relative;
  }
  TreeNodeName {
    height: 100%;
    max-width: 250px;
    overflow: hidden;
    text-overflow: ellipsis;
  } 
  portal {
    box-sizing: border-box;
    margin-left: auto !important;
    margin-right: 16px !important;
    visibility: hidden;
  }
`;

export const NavigationNodeControl: NavTreeControlComponent = observer<NavTreeControlProps, HTMLDivElement>(function NavigationNodeControl({
  node,
  dragging,
}, ref) {
  const treeNodeContext = useContext(TreeNodeContext);
  const treeContext = useContext(ElementsTreeContext);
  const navNodeInfoResource = useService(NavNodeInfoResource);
  const navTreeResource = useService(NavTreeResource);
  const outdated = getComputed(() => navNodeInfoResource.isOutdated(node.id) && !treeNodeContext.loading);
  const error = getComputed(() => (
    !!navNodeInfoResource.getException(node.id)
    || !!navTreeResource.getException(node.id)
  ));
  const connected = getComputed(() => node.objectFeatures.includes(EObjectFeature.dataSourceConnected));
  const selected = treeNodeContext.selected;

  const [editing, setEditing] = useState(false);

  const nodeActions = useObjectRef<INodeActions>({
    rename: () => {
      setEditing(true);
    },
  });

  let icon = node.icon;

  if (error) {
    icon = '/icons/error_icon_sm.svg';
  }

  function handlePortalClick(event: React.MouseEvent<HTMLDivElement>) {
    EventContext.set(event, EventStopPropagationFlag);
    treeNodeContext.select();
  }

  function onClickHandler(event: React.MouseEvent<HTMLDivElement>) {
    treeNodeContext.select(event.ctrlKey || event.metaKey);
  }

  return styled(TREE_NODE_STYLES, styles)(
    <TreeNodeControl ref={ref} onClick={onClickHandler} {...use({ outdated, editing, dragging })}>
      <TreeNodeExpand filterActive={treeContext?.tree.filtering} />
      <TreeNodeIcon icon={icon}>
        <ConnectionMark connected={connected} />
      </TreeNodeIcon>
      <TreeNodeName title={node.name}>
        {editing ? <NavigationNodeEditor node={node} onClose={() => setEditing(false)} /> : node.name}
      </TreeNodeName>
      {!editing && (
        <portal onClick={handlePortalClick}>
          <TreeNodeMenu node={node} actions={nodeActions} selected={selected} />
        </portal>
      )}
    </TreeNodeControl>
  );
}, { forwardRef: true });
