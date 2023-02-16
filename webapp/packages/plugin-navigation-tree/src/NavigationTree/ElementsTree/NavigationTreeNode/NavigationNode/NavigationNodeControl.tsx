/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import React, { forwardRef, useContext, useState } from 'react';
import styled, { css, use } from 'reshadow';

import { ConnectionMark, getComputed, TreeNodeContext, TreeNodeControl, TreeNodeExpand, TreeNodeIcon, TreeNodeName, TREE_NODE_STYLES, useObjectRef } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { EventContext, EventStopPropagationFlag } from '@cloudbeaver/core-events';
import { NavNodeInfoResource, NavTreeResource, EObjectFeature, type INodeActions } from '@cloudbeaver/core-navigation-tree';
import { GlobalConstants, isValidUrl } from '@cloudbeaver/core-utils';

import { ElementsTreeContext } from '../../ElementsTreeContext';
import type { NavTreeControlComponent, NavTreeControlProps } from '../../NavigationNodeComponent';
import { TreeNodeMenuLoader } from '../TreeNodeMenu/TreeNodeMenuLoader';
import { NavigationNodeEditorLoader } from './NavigationNodeLoaders';


const styles = css`
  TreeNodeControl {
    transition: opacity 0.3s ease;
    opacity: 1;

    &[|outdated] {
      opacity: 0.5;
    }
  }
  TreeNodeControl:hover > portal, 
  TreeNodeControl:global([aria-selected=true]) > portal,
  portal:focus-within {
    visibility: visible;
  }
  TreeNodeName {
    height: 100%;
    max-width: 320px;
    overflow: hidden;
    text-overflow: ellipsis;
  } 
  portal {
    position: relative;
    box-sizing: border-box;
    margin-left: auto !important;
    margin-right: 8px !important;
    visibility: hidden;
  }
  name-box {
    overflow: hidden;
    text-overflow: ellipsis;
  }
`;

export const NavigationNodeControl: NavTreeControlComponent = observer<NavTreeControlProps, HTMLDivElement>(forwardRef(function NavigationNodeControl({
  node,
  dndElement,
  dndPlaceholder,
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

  function renderIcon() {
    if (!icon) {
      return null;
    }
    const url = isValidUrl(icon) ? icon : GlobalConstants.absoluteUrl(icon);

    return (
      <svg width="16" height="16" viewBox="0 0 16 16">
        <mask id="mask">
          <rect fill="#fff" x="0" y="0" width="16" height="16" />
          <circle fill="#000" cx="12" cy="12" r="6" />
          <rect fill="#000" x="12" y="12" width="5" height="5" mask="url(#mask)" />
        </mask>
        <image xlinkHref={url} width="16" height="16" mask={connected ? 'url(#mask)' : undefined} />
      </svg>
    );
  }

  const expandable = getComputed(() => treeContext?.tree.isNodeExpandable(node.id) ?? true);

  return styled(TREE_NODE_STYLES, styles)(
    <TreeNodeControl ref={ref} onClick={onClickHandler} {...use({ outdated, editing, dragging: dndElement })}>
      {expandable && <TreeNodeExpand filterActive={treeContext?.tree.filtering} />}
      <TreeNodeIcon {...use({ connected })}>
        {renderIcon()}
        <ConnectionMark connected={connected} />
      </TreeNodeIcon>
      <TreeNodeName title={node.name}>
        {editing ? (
          <NavigationNodeEditorLoader node={node} onClose={() => setEditing(false)} />
        ) : (
          <name-box>{node.name}</name-box>
        )}
      </TreeNodeName>
      {!editing && !dndPlaceholder && (
        <portal onClick={handlePortalClick}>
          <TreeNodeMenuLoader node={node} actions={nodeActions} selected={selected} />
        </portal>
      )}
    </TreeNodeControl>
  );
}));
