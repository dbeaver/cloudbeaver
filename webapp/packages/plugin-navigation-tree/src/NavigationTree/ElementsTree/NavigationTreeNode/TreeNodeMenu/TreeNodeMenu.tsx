/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { getComputed, Icon, type IContextMenuPosition, s, useS } from '@cloudbeaver/core-blocks';
import { ConnectionInfoResource, DATA_CONTEXT_CONNECTION } from '@cloudbeaver/core-connections';
import { useDataContextLink } from '@cloudbeaver/core-data-context';
import { useService } from '@cloudbeaver/core-di';
import { DATA_CONTEXT_NAV_NODE, type INodeActions, type NavNode } from '@cloudbeaver/core-navigation-tree';
import { ContextMenu } from '@cloudbeaver/core-ui';
import { useMenu } from '@cloudbeaver/core-view';

import { MENU_NAV_TREE } from '../../MENU_NAV_TREE.js';
import { DATA_CONTEXT_NAV_NODE_ACTIONS } from './DATA_CONTEXT_NAV_NODE_ACTIONS.js';
import style from './TreeNodeMenu.module.css';

export interface TreeNodeMenuProps {
  node: NavNode;
  actions?: INodeActions;
  selected?: boolean;
  contextMenuPosition?: IContextMenuPosition;
  onClose?: () => void;
}

export const TreeNodeMenu = observer<TreeNodeMenuProps>(function TreeNodeMenu({ node, actions, selected, contextMenuPosition, onClose }) {
  const styles = useS(style);
  const connectionInfoResource = useService(ConnectionInfoResource);
  const menu = useMenu({ menu: MENU_NAV_TREE });
  const connectionKey = getComputed(() => connectionInfoResource.getConnectionIdForNodeId(node.projectId!, node.id));

  useDataContextLink(menu.context, (context, id) => {
    context.set(DATA_CONTEXT_NAV_NODE, node, id);
    context.set(DATA_CONTEXT_NAV_NODE_ACTIONS, actions, id);

    if (connectionKey) {
      context.set(DATA_CONTEXT_CONNECTION, connectionKey, id);
    }
  });

  function handleVisibleSwitch(visible: boolean) {
    if (!visible) {
      onClose?.();
    }
  }

  return (
    <ContextMenu
      menu={menu}
      className={s(styles, { contextMenu: true, selected })}
      contextMenuPosition={contextMenuPosition}
      modal
      onVisibleSwitch={handleVisibleSwitch}
    >
      <Icon className={s(styles, { icon: true })} name="snack" viewBox="0 0 16 10" />
    </ContextMenu>
  );
});
