/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useContext, useState } from 'react';

import { getComputed, Icon, s, useContextMenuPosition, useMouse, useS, useStateDelay } from '@cloudbeaver/core-blocks';
import { ConnectionInfoResource, DATA_CONTEXT_CONNECTION } from '@cloudbeaver/core-connections';
import { useDataContextLink } from '@cloudbeaver/core-data-context';
import { useService } from '@cloudbeaver/core-di';
import { DATA_CONTEXT_NAV_NODE, type DBObject, type NavNode, NavNodeManagerService } from '@cloudbeaver/core-navigation-tree';
import { ContextMenu } from '@cloudbeaver/core-ui';
import { useMenu } from '@cloudbeaver/core-view';
import type { RenderCellProps } from '@cloudbeaver/plugin-data-grid';
import { MENU_NAV_TREE, useNode } from '@cloudbeaver/plugin-navigation-tree';

import { getValue } from '../../helpers.js';
import classes from './CellFormatter.module.css';
import { TableContext } from './TableContext.js';

interface Props {
  value: string;
  node: NavNode;
}

export const Menu = observer<Props>(function Menu({ value, node }) {
  const styles = useS(classes);
  const navNodeManagerService = useService(NavNodeManagerService);
  const connectionsInfoResource = useService(ConnectionInfoResource);
  const menu = useMenu({ menu: MENU_NAV_TREE });
  const mouse = useMouse<HTMLDivElement>();
  const [menuOpened, switchState] = useState(false);
  const connection = connectionsInfoResource.getConnectionForNode(node.id);
  const contextMenuPosition = useContextMenuPosition();

  useDataContextLink(menu.context, (context, id) => {
    context.set(DATA_CONTEXT_NAV_NODE, node, id);

    if (connection) {
      context.set(DATA_CONTEXT_CONNECTION, connection, id);
    }
  });

  function openNode() {
    navNodeManagerService.navToNode(node.id, node.parentId);
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

  function valueFieldClickHandler(event: React.MouseEvent<HTMLDivElement>) {
    event.preventDefault();
  }

  return (
    <ContextMenu contextMenuPosition={contextMenuPosition} menu={menu} placement="auto-end" modal disclosure onVisibleSwitch={switchState}>
      <div className={s(styles, { container: true, empty: menuEmpty })} onDoubleClick={openNode}>
        <div ref={mouse.reference} className={classes['box']} onContextMenu={contextMenuOpenHandler}>
          <div className={s(styles, { value: true, cellValue: true })} title={value} onClick={valueFieldClickHandler}>
            {value}
          </div>
          {!menuEmpty && <Icon className={classes['icon']} name="snack" viewBox="0 0 16 10" />}
        </div>
      </div>
    </ContextMenu>
  );
});

export const CellFormatter = observer<RenderCellProps<DBObject>>(function CellFormatter(props) {
  const tableContext = useContext(TableContext);

  if (!tableContext.tableData) {
    throw new Error('Table data must be provided');
  }

  const { node } = useNode(props.row.id);

  const columnIdx = tableContext.tableData.getColumnIdx(props.column);
  const property = props.row.object?.properties?.[columnIdx];
  const value = property ? getValue(property.value) : '';

  return (
    <div className={classes['cell']} title={value}>
      {columnIdx === 0 && !!node ? <Menu node={node} value={value} /> : <span className={classes['cellValue']}>{value}</span>}
    </div>
  );
});
