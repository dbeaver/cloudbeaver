/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';
import { useContext } from 'react';
import styled, { css, use } from 'reshadow';

import { TreeNodeContext, TreeNodeControl, TreeNodeExpand, TreeNodeIcon, TreeNodeName, TREE_NODE_STYLES } from '@cloudbeaver/core-blocks';
import { ConnectionInfoResource } from '@cloudbeaver/core-connections';
import { useService } from '@cloudbeaver/core-di';
import { useStyles } from '@cloudbeaver/core-theming';

import { NavNode } from '../../../shared/NodesManager/EntityTypes';
import { EObjectFeature } from '../../../shared/NodesManager/EObjectFeature';
import { NodeManagerUtils } from '../../../shared/NodesManager/NodeManagerUtils';
import { TreeNodeMenu } from '../TreeNodeMenu/TreeNodeMenu';

const styles = css`    
  TreeNodeControl {
    &[use|disconnected] {
      & TreeNodeIcon, & TreeNodeName {
        opacity: 0.7;
      }
    }
  }  
  TreeNodeControl:hover > portal, 
  TreeNodeControl:global([aria-selected=true]) > portal,
  portal:focus-within {
    visibility: visible;
  }
  portal {
    box-sizing: border-box;
    margin-left: auto !important;
    margin-right: 16px !important;
    visibility: hidden;
  }
`;

interface Props {
  node: NavNode;
}

export const NavigationNodeControl: React.FC<Props> = observer(function NavigationNodeControl({
  node,
}) {
  const context = useContext(TreeNodeContext);
  const connectionInfoResource = useService(ConnectionInfoResource);

  let disconnected = false;
  if (node.objectFeatures.includes(EObjectFeature.dataSource)) {
    const connectionInfo = connectionInfoResource.get(NodeManagerUtils.connectionNodeIdToConnectionId(node.id));
    disconnected = !connectionInfo?.connected;
  }

  return styled(useStyles(TREE_NODE_STYLES, styles))(
    <TreeNodeControl {...use({ disconnected })}>
      <TreeNodeExpand />
      <TreeNodeIcon icon={node.icon} />
      <TreeNodeName>{node.name}</TreeNodeName>
      <portal as="div">
        <TreeNodeMenu node={node} selected={context?.selected} />
      </portal>
    </TreeNodeControl>
  );
});
