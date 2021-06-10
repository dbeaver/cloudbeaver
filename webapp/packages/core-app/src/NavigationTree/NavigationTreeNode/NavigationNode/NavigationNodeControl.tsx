/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useCallback, useContext } from 'react';
import styled, { css, use } from 'reshadow';

import { TreeNodeContext, TreeNodeControl, TreeNodeExpand, TreeNodeIcon, TreeNodeName, TREE_NODE_STYLES } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { composes, useStyles } from '@cloudbeaver/core-theming';

import type { NavNode } from '../../../shared/NodesManager/EntityTypes';
import { EObjectFeature } from '../../../shared/NodesManager/EObjectFeature';
import { NavNodeInfoResource } from '../../../shared/NodesManager/NavNodeInfoResource';
import { TreeNodeMenu } from '../TreeNodeMenu/TreeNodeMenu';

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
    TreeNodeIcon {
      position: relative;
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

export const NavigationNodeControl: React.FC<Props> = observer(function NavigationNodeControl({
  node,
}) {
  const context = useContext(TreeNodeContext);
  const navNodeInfoResource = useService(NavNodeInfoResource);
  const outdated = navNodeInfoResource.isOutdated(node.id) && !context?.loading;

  const connected = node.objectFeatures.includes(EObjectFeature.dataSourceConnected);

  const onClickHandler = useCallback((event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    context?.select(event.ctrlKey || event.metaKey);
  }, [context]);

  return styled(useStyles(TREE_NODE_STYLES, styles))(
    <TreeNodeControl onClick={onClickHandler} {...use({ outdated })}>
      <TreeNodeExpand />
      <TreeNodeIcon icon={node.icon}>
        <status {...use({ connected })} />
      </TreeNodeIcon>
      <TreeNodeName>{node.name}</TreeNodeName>
      <portal>
        <TreeNodeMenu node={node} selected={context?.selected} />
      </portal>
    </TreeNodeControl>
  );
});
