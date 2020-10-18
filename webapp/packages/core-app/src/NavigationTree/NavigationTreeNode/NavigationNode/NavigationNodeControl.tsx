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
import { useStyles } from '@cloudbeaver/core-theming';

import { NavNode } from '../../../shared/NodesManager/EntityTypes';
import { TreeNodeMenu } from '../TreeNodeMenu/TreeNodeMenu';

const styles = css`      
  TreeNodeControl:hover > portal, 
  TreeNodeControl:global([aria-selected=true]) > portal,
  portal:focus-within {
    visibility: visible;
  }
  portal {
    box-sizing: border-box;
    margin-left: auto;
    margin-right: 16px;
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
  return styled(useStyles(TREE_NODE_STYLES, styles))(
    <TreeNodeControl>
      <TreeNodeExpand />
      <TreeNodeIcon icon={node.icon} />
      <TreeNodeName>{node.name}</TreeNodeName>
      <portal as="div">
        <TreeNodeMenu node={node} selected={context?.selected} />
      </portal>
    </TreeNodeControl>
  );
});
