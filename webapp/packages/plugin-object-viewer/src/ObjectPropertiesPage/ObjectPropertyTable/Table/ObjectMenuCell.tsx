/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { getComputed, Icon, Link, Loader, s, StaticImage, useContextMenuPosition, useMouse, useS, useStateDelay } from '@cloudbeaver/core-blocks';
import { ConnectionInfoResource, DATA_CONTEXT_CONNECTION } from '@cloudbeaver/core-connections';
import { useDataContextLink } from '@cloudbeaver/core-data-context';
import { useService } from '@cloudbeaver/core-di';
import { DATA_CONTEXT_NAV_NODE, NavNodeManagerService, type DBObject } from '@cloudbeaver/core-navigation-tree';
import { ContextMenu } from '@cloudbeaver/core-ui';
import { MENU_NAV_TREE, useNode } from '@cloudbeaver/plugin-navigation-tree';
import { observer } from 'mobx-react-lite';
import { useState } from 'react';
import classes from './ObjectMenuCell.module.css';
import { useMenu } from '@cloudbeaver/core-view';
import { getObjectPropertyDisplayValue } from '@cloudbeaver/core-sdk';

interface Props {
  object: DBObject;
}

export const ObjectMenuCell = observer<Props>(function ObjectMenuCell({ object }) {
  const { node } = useNode(object.id);

  if (!node) {
    throw new Error('Node not found');
  }

  const styles = useS(classes);
  const navNodeManagerService = useService(NavNodeManagerService);
  const connectionsInfoResource = useService(ConnectionInfoResource);
  const menu = useMenu({ menu: MENU_NAV_TREE });
  const mouse = useMouse<HTMLDivElement>();
  const [menuOpened, switchState] = useState(false);
  const connection = connectionsInfoResource.getConnectionForNode(node.id);
  const contextMenuPosition = useContextMenuPosition();
  const connectionKey = connectionsInfoResource.getConnectionIdForNodeId(node.projectId!, node.id);

  useDataContextLink(menu.context, (context, id) => {
    context.set(DATA_CONTEXT_NAV_NODE, node, id);

    if (connection) {
      context.set(DATA_CONTEXT_CONNECTION, connectionKey, id);
    }
  });

  function openNode() {
    navNodeManagerService.navToNode(node!.id, node!.parentId);
  }

  const mouseEnter = useStateDelay(mouse.state.mouseEnter, 33); // track mouse update only 30 times per second

  const menuEmpty =
    !menuOpened &&
    getComputed(() => {
      if (!mouseEnter) {
        return true;
      }

      return !menu.available;
    });

  function contextMenuOpenHandler(event: React.MouseEvent<HTMLDivElement>) {
    contextMenuPosition.handleContextMenuOpen(event);
  }

  const property = object.object?.properties?.[0];
  const value = property ? getObjectPropertyDisplayValue(property) : '';

  return (
    <div ref={mouse.reference} className={s(styles, { container: true })} onDoubleClick={openNode} onContextMenu={contextMenuOpenHandler}>
      <div className={s(styles, { box: true })}>
        <div className={s(styles, { objectIconBox: true })}>
          {node?.icon && <StaticImage icon={node.icon} className={s(styles, { objectIcon: true })} />}
        </div>
        <Link className={s(styles, { value: true })} title={value} inline onClick={openNode}>
          {value}
        </Link>
        {!menuEmpty && (
          <div className={s(styles, { menuBox: true })}>
            <Loader suspense small fullSize>
              <ContextMenu
                contextMenuPosition={contextMenuPosition}
                menu={menu}
                placement="auto-end"
                hidden={menuEmpty}
                modal
                disclosure
                onVisibleSwitch={switchState}
              >
                <Icon className={s(styles, { menuIcon: true })} name="snack" viewBox="0 0 16 10" />
              </ContextMenu>
            </Loader>
          </div>
        )}
      </div>
    </div>
  );
});
