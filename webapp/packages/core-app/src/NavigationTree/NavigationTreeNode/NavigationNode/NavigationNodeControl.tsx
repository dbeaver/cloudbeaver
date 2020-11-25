/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';
import { useContext } from 'react';
import styled, { css } from 'reshadow';

import { TreeNodeContext, TreeNodeControl, TreeNodeExpand, TreeNodeIcon, TreeNodeName, TREE_NODE_STYLES } from '@cloudbeaver/core-blocks';
import { ConnectionInfoResource } from '@cloudbeaver/core-connections';
import { useService } from '@cloudbeaver/core-di';
import { composes, useStyles } from '@cloudbeaver/core-theming';

import { NavNode } from '../../../shared/NodesManager/EntityTypes';
import { EObjectFeature } from '../../../shared/NodesManager/EObjectFeature';
import { NodeManagerUtils } from '../../../shared/NodesManager/NodeManagerUtils';
import { TreeNodeMenu } from '../TreeNodeMenu/TreeNodeMenu';

const styles = composes(
  css`
    status {
      composes: theme-background-positive theme-border-color-surface from global;
    }
  `,
  css`
    TreeNodeControl:hover > portal, 
    TreeNodeControl:global([aria-selected=true]) > portal,
    portal:focus-within {
      visibility: visible;
    }
    TreeNodeIcon {
      position: relative;
    }
    status {
      position: absolute;
      bottom: 0;
      right: 0;
      box-sizing: border-box;
      width: 8px;
      height: 8px;
      border-radius: 50%;      
      border: 1px solid;
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

export const NavigationNodeControl: React.FC<Props> = observer(function NavigationNodeControl({
  node,
}) {
  const context = useContext(TreeNodeContext);
  const connectionInfoResource = useService(ConnectionInfoResource);

  let connected = false;

  if (node.objectFeatures.includes(EObjectFeature.dataSource)) {
    const connectionInfo = connectionInfoResource.get(NodeManagerUtils.connectionNodeIdToConnectionId(node.id));

    connected = !!connectionInfo?.connected;
  }

  return styled(useStyles(TREE_NODE_STYLES, styles))(
    <TreeNodeControl>
      <TreeNodeExpand />
      <TreeNodeIcon icon={node.icon}>
        {connected && <status as='div' />}
      </TreeNodeIcon>
      <TreeNodeName>{node.name}</TreeNodeName>
      <portal as="div">
        <TreeNodeMenu node={node} selected={context?.selected} />
      </portal>
    </TreeNodeControl>
  );
});
