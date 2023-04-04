/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled, { use } from 'reshadow';

import { getComputed, Icon } from '@cloudbeaver/core-blocks';
import { ConnectionInfoResource } from '@cloudbeaver/core-connections';
import { useService } from '@cloudbeaver/core-di';
import { type NavNode, type INodeActions, DATA_CONTEXT_NAV_NODE } from '@cloudbeaver/core-navigation-tree';
import { ContextMenu } from '@cloudbeaver/core-ui';
import { useMenu } from '@cloudbeaver/core-view';
import { DATA_CONTEXT_CONNECTION } from '@cloudbeaver/plugin-connections';

import { MENU_NAV_TREE } from '../../MENU_NAV_TREE';
import { DATA_CONTEXT_NAV_NODE_ACTIONS } from './DATA_CONTEXT_NAV_NODE_ACTIONS';
import { treeNodeMenuStyles } from './treeNodeMenuStyles';

interface Props {
  node: NavNode;
  actions?: INodeActions;
  selected?: boolean;
}

export const TreeNodeMenu = observer<Props>(function TreeNodeMenu({
  node,
  actions,
  selected,
}) {
  const connectionsInfoResource = useService(ConnectionInfoResource);
  const menu = useMenu({ menu: MENU_NAV_TREE });
  menu.context.set(DATA_CONTEXT_NAV_NODE, node);
  menu.context.set(DATA_CONTEXT_NAV_NODE_ACTIONS, actions);

  const connection = getComputed(() => connectionsInfoResource.getConnectionForNode(node.id));

  if (connection) {
    menu.context.set(DATA_CONTEXT_CONNECTION, connection);
  }

  return styled(treeNodeMenuStyles)(
    <ContextMenu menu={menu} {...use({ selected })} modal>
      <Icon name="snack" viewBox="0 0 16 10" />
    </ContextMenu>
  );
});
