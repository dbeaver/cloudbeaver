/*
 * cloudbeaver - Cloud Database Manager
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
import { useStyles } from '@cloudbeaver/core-theming';

import { CoreSettingsService } from '../../../CoreSettingsService';
import { useChildren } from '../../../shared/useChildren';

interface Props {
  nodeId: string;
  component: React.FC<{
    nodeId: string;
  }>;
}

export const NavigationNodeNested: React.FC<Props> = observer(function NavigationNodeNested({
  nodeId,
  component,
}) {
  const config = useService(CoreSettingsService);
  const styles = useStyles(TREE_NODE_STYLES);
  const context = useContext(TreeNodeContext);
  const children = useChildren(nodeId);
  const limit = useMemo(() => computed(() => config.settings.getValue('app.navigationTree.childrenLimit')), [config]);

  if (!children.children || !context?.expanded) {
    return null;
  }

  const NavigationNode = component;

  return styled(styles)(
    <TreeNodeNested>
      {children.children.slice(0, limit.get()).map(child => <NavigationNode key={child} nodeId={child} />)}
    </TreeNodeNested>
  );
});
