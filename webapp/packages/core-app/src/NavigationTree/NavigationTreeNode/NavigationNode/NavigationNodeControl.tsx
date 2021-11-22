/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useCallback, useContext, useState } from 'react';
import styled, { css, use } from 'reshadow';

import { getComputed, TreeNodeContext, TreeNodeControl, TreeNodeExpand, TreeNodeIcon, TreeNodeName, TREE_NODE_STYLES, useObjectRef } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { composes, useStyles } from '@cloudbeaver/core-theming';

import type { NavNode } from '../../../shared/NodesManager/EntityTypes';
import { EObjectFeature } from '../../../shared/NodesManager/EObjectFeature';
import type { INodeActions } from '../../../shared/NodesManager/INodeActions';
import { NavNodeInfoResource } from '../../../shared/NodesManager/NavNodeInfoResource';
import { NavTreeResource } from '../../../shared/NodesManager/NavTreeResource';
import { TreeNodeMenu } from '../TreeNodeMenu/TreeNodeMenu';
import { NavigationNodeEditor } from './NavigationNodeEditor';

const styles = composes(
  css`
    status {
      composes: theme-background-positive theme-border-color-surface from global;
    }
  `,
  css`
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
    status {
      position: absolute;
      opacity: 0;
      transition: opacity 0.3s ease;
      bottom: 0;
      right: 0;
      box-sizing: border-box;
      width: 8px;
      height: 8px;
      border-radius: 50%;      
      border: 1px solid;

      &[|connected] {
        opacity: 1;
      }
    }    
    portal {
      box-sizing: border-box;
      margin-left: auto !important;
      margin-right: 16px !important;
      visibility: hidden;
    }
`);

interface Props {
  node: NavNode;
}

export const NavigationNodeControl = observer<Props>(function NavigationNodeControl({
  node,
}) {
  const context = useContext(TreeNodeContext);
  const navNodeInfoResource = useService(NavNodeInfoResource);
  const navTreeResource = useService(NavTreeResource);
  const outdated = getComputed(() => navNodeInfoResource.isOutdated(node.id) && !context.loading);

  const [editing, setEditing] = useState(false);

  const nodeActions = useObjectRef<INodeActions>({
    rename: () => {
      setEditing(true);
    },
  });

  let icon = node.icon;

  if (navNodeInfoResource.getException(node.id) || navTreeResource.getException(node.id)) {
    icon = '/icons/error_icon_sm.svg';
  }

  const connected = node.objectFeatures.includes(EObjectFeature.dataSourceConnected);

  const onClickHandler = useCallback((event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    context.select(event.ctrlKey || event.metaKey);
  }, [context]);

  return styled(useStyles(TREE_NODE_STYLES, styles))(
    <TreeNodeControl onClick={onClickHandler} {...use({ outdated, editing })}>
      <TreeNodeExpand />
      <TreeNodeIcon icon={icon}>
        <status {...use({ connected })} />
      </TreeNodeIcon>
      <TreeNodeName title={node.name}>
        {editing ? <NavigationNodeEditor node={node} onClose={() => setEditing(false)} /> : node.name}
      </TreeNodeName>
      {!editing && (
        <portal>
          <TreeNodeMenu node={node} actions={nodeActions} selected={context.selected} />
        </portal>
      )}
    </TreeNodeControl>
  );
});
