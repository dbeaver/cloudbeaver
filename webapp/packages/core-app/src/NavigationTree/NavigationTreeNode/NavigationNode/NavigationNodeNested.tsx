/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { computed } from 'mobx';
import { observer } from 'mobx-react-lite';
import { useContext, useMemo } from 'react';
import styled from 'reshadow';

import { TreeNodeContext, TreeNodeNested, TREE_NODE_STYLES } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { resourceKeyList } from '@cloudbeaver/core-sdk';
import { useStyles } from '@cloudbeaver/core-theming';

import { NavNodeInfoResource } from '../../../shared/NodesManager/NavNodeInfoResource';
import { useChildren } from '../../../shared/useChildren';

interface Props {
  nodeId: string;
  component: React.FC<{
    nodeId: string;
  }>;
}

function isDefined<T>(val: T | undefined | null): val is T {
  return val !== undefined && val !== null;
}

export const NavigationNodeNested: React.FC<Props> = observer(function NavigationNodeNested({
  nodeId,
  component,
}) {
  const styles = useStyles(TREE_NODE_STYLES);
  const context = useContext(TreeNodeContext);
  const navNodeInfo = useService(NavNodeInfoResource);
  const childrenInfo = useChildren(nodeId);

  const children = useMemo(() => computed(() => {
    if (!childrenInfo?.children) {
      return [];
    }

    const childrenEntities = navNodeInfo.get(resourceKeyList(childrenInfo.children)).filter(isDefined);

    if (!context?.filterValue) {
      return childrenEntities;
    }

    return childrenEntities.filter(child => child.name?.toLowerCase().includes(context.filterValue.toLowerCase()));
  }), [childrenInfo.children, context?.filterValue, navNodeInfo]).get();

  if (!children.length || !context?.expanded) {
    return null;
  }

  const NavigationNode = component;

  return styled(styles)(
    <TreeNodeNested>
      {children.map(child => <NavigationNode key={child.id} nodeId={child.id} />)}
    </TreeNodeNested>
  );
});
