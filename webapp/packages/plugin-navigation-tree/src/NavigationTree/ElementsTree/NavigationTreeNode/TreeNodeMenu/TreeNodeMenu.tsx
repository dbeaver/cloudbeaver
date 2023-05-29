/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import styled, { use } from 'reshadow';

import { getComputed, Icon, IMouseContextMenu } from '@cloudbeaver/core-blocks';
import { ConnectionInfoResource } from '@cloudbeaver/core-connections';
import { useService } from '@cloudbeaver/core-di';
import { DATA_CONTEXT_NAV_NODE, type INodeActions, type NavNode } from '@cloudbeaver/core-navigation-tree';
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
  mouseContextMenu?: IMouseContextMenu;
  onClose?: () => void;
}

export const TreeNodeMenu = observer<Props>(function TreeNodeMenu({ node, actions, selected, mouseContextMenu, onClose }) {
  const connectionsInfoResource = useService(ConnectionInfoResource);
  const menu = useMenu({ menu: MENU_NAV_TREE });
  menu.context.set(DATA_CONTEXT_NAV_NODE, node);
  menu.context.set(DATA_CONTEXT_NAV_NODE_ACTIONS, actions);

  const connection = getComputed(() => connectionsInfoResource.getConnectionForNode(node.id));

  if (connection) {
    menu.context.set(DATA_CONTEXT_CONNECTION, connection);
  }

  function handleVisibleSwitch(visible: boolean) {
    if (!visible) {
      onClose?.();
    }
  }

  return styled(treeNodeMenuStyles)(
    <ContextMenu menu={menu} mouseContextMenu={mouseContextMenu} onVisibleSwitch={handleVisibleSwitch} {...use({ selected })} modal>
      <Icon name="snack" viewBox="0 0 16 10" />
    </ContextMenu>,
  );
});
