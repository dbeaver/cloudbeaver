/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useContext, useState } from 'react';
import styled, { css, use } from 'reshadow';

import { getComputed, Icon, useMouse, useStateDelay } from '@cloudbeaver/core-blocks';
import { ConnectionInfoResource } from '@cloudbeaver/core-connections';
import { useService } from '@cloudbeaver/core-di';
import { type NavNode, NavNodeManagerService, DATA_CONTEXT_NAV_NODE, type DBObject } from '@cloudbeaver/core-navigation-tree';
import { ContextMenu } from '@cloudbeaver/core-ui';
import { useMenu } from '@cloudbeaver/core-view';
import { DATA_CONTEXT_CONNECTION } from '@cloudbeaver/plugin-connections';
import { MENU_NAV_TREE, useNode } from '@cloudbeaver/plugin-navigation-tree';
import type { FormatterProps } from '@cloudbeaver/plugin-react-data-grid';

import { getValue } from '../../helpers';
import { TableContext } from './TableContext';

const menuStyles = css`
  menu-container {
    cursor: pointer;
    width: 100%;
  }
  menu-container:not([|menuEmpty]) value {
    padding-right: 8px;
  }
  menu-box {
    display: flex;
    height: 100%;
    align-items: center;

    & Icon {
      width: 16px;
    }
  }
  value {
    flex-grow: 1;
    flex-shrink: 1;
  }
`;

interface Props {
  value: string;
  node: NavNode;
}

export const Menu = observer<Props>(function Menu({ value, node }) {
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

  const menuEmpty = !menuOpened && getComputed(() => {
    if (!mouseEnter) {
      return true;
    }

    return !menu.available;
  });

  return styled(menuStyles)(
    <menu-container
      ref={mouse.reference}
      onDoubleClick={openNode}
      {...use({ menuEmpty, menuOpened })}
    >
      <menu-box>
        <value className='cell-formatter__value' title={value}>{value}</value>
        {!menuEmpty && (
          <ContextMenu menu={menu} modal disclosure onVisibleSwitch={switchState}>
            <menu-icon><Icon name="snack" viewBox="0 0 16 10" /></menu-icon>
          </ContextMenu>
        )}
      </menu-box>
    </menu-container>
  );
});

export const CellFormatter = observer<FormatterProps<DBObject>>(function CellFormatter(props) {
  const tableContext = useContext(TableContext);

  if (!tableContext.tableData) {
    throw new Error('Table data must be provided');
  }

  const { node } = useNode(props.row.id);

  const columnIdx = tableContext.tableData.getColumnIdx(props.column);
  const property = props.row.object?.properties?.[columnIdx];
  const value = property ? getValue(property.value) : '';

  return (
    <div className='cell-formatter' title={value}>
      {columnIdx === 0 && !!node ? <Menu node={node} value={value} /> : <span className='cell-formatter__value'>{value}</span>}
    </div>
  );
});