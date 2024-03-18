/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useContext, useState } from 'react';

import { getComputed, Icon, s, useMouse, useS, useStateDelay } from '@cloudbeaver/core-blocks';
import { ConnectionInfoResource, DATA_CONTEXT_CONNECTION } from '@cloudbeaver/core-connections';
import { useService } from '@cloudbeaver/core-di';
import { DATA_CONTEXT_NAV_NODE, type DBObject, type NavNode, NavNodeManagerService } from '@cloudbeaver/core-navigation-tree';
import { ContextMenu } from '@cloudbeaver/core-ui';
import { useMenu } from '@cloudbeaver/core-view';
import { MENU_NAV_TREE, useNode } from '@cloudbeaver/plugin-navigation-tree';
import type { RenderCellProps } from '@cloudbeaver/plugin-react-data-grid';

import { getValue } from '../../helpers';
import classes from './CellFormatter.m.css';
import { TableContext } from './TableContext';

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

  menu.context.set(DATA_CONTEXT_NAV_NODE, node);

  const connection = connectionsInfoResource.getConnectionForNode(node.id);

  if (connection) {
    menu.context.set(DATA_CONTEXT_CONNECTION, connection);
  }

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

  return (
    <div ref={mouse.reference} className={s(styles, { container: true, empty: menuEmpty })} onDoubleClick={openNode}>
      <div className={classes.box}>
        <div className={s(styles, { value: true }, 'cell-formatter__value')} title={value}>
          {value}
        </div>
        {!menuEmpty && (
          <ContextMenu menu={menu} modal disclosure onVisibleSwitch={switchState}>
            <div>
              <Icon className={classes.icon} name="snack" viewBox="0 0 16 10" />
            </div>
          </ContextMenu>
        )}
      </div>
    </div>
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
    <div className="cell-formatter" title={value}>
      {columnIdx === 0 && !!node ? <Menu node={node} value={value} /> : <span className="cell-formatter__value">{value}</span>}
    </div>
  );
});
