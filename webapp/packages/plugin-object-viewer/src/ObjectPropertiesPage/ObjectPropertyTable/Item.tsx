/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useState } from 'react';
import styled, { css, use } from 'reshadow';

import { DBObject, NavNode, NavNodeManagerService, DATA_CONTEXT_NAV_NODE, MENU_NAV_TREE, useNode } from '@cloudbeaver/core-app';
import {
  StaticImage, TableItem, TableColumnValue, TableItemSelect, useMouse, getComputed, Icon, useStateDelay
} from '@cloudbeaver/core-blocks';
import { ConnectionInfoResource } from '@cloudbeaver/core-connections';
import { useService } from '@cloudbeaver/core-di';
import type { ObjectPropertyInfo } from '@cloudbeaver/core-sdk';
import { useStyles } from '@cloudbeaver/core-theming';
import { ContextMenu } from '@cloudbeaver/core-ui';
import { useMenu } from '@cloudbeaver/core-view';
import { DATA_CONTEXT_CONNECTION } from '@cloudbeaver/plugin-connections';

import { getValue } from '../helpers';

const itemStyles = css`
    icon {
      display: flex;
      & StaticImage {
        width: 16px;
      }
      & placeholder {
        width: 16px;
        height: 16px;
      }
    }
    placeholder {
      height: 16px;
      width: 180px;
    }
    TableItem {
      position: relative;
    }
    menu-box {
      display: flex;
      height: 100%;
      align-items: center;

      & Icon {
        width: 16px;
      }
    }
    menu-icon {
      padding-right: 8px;
    }
    menu-name {
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
      max-width: 500px;
    }
    TableColumnValue:not(:hover):not([|menuOpened]) {
      & Icon {
        opacity: 0;
      }
    }
    TableColumnValue[|menuAvailable]:not([|isMenuEmpty]) menu-box menu-name {
      padding-left: 8px;
    }
    TableColumnValue[|menuAvailable][|isMenuEmpty] menu-box menu-name {
      padding-left: 32px;
    }
    TableColumnValue:nth-child(3) {
      cursor: pointer;
      user-select: none;
    }
  `;

interface Props {
  dbObject: DBObject;
  columns: number;
}

export const Item = observer<Props>(function Item({
  dbObject, columns,
}) {
  const styles = useStyles(itemStyles);
  const objectId = dbObject.id;
  const { node } = useNode(objectId);

  if (!node) {
    return styled(styles)(
      <TableItem item={objectId}>
        <TableColumnValue centerContent>
          <TableItemSelect />
        </TableColumnValue>
        <TableColumnValue>
          <icon><placeholder /></icon>
        </TableColumnValue>
        {Array(columns)
          .fill(0)
          .map((_, i) => <TableColumnValue key={i}><placeholder /></TableColumnValue>)}
      </TableItem>
    );
  }

  if (!dbObject.object?.properties || dbObject.object.properties.length === 0) {
    return styled(styles)(
      <TableItem item={objectId}>
        <TableColumnValue centerContent>
          <TableItemSelect />
        </TableColumnValue>
        <TableColumnValue>
          <icon>
            <StaticImage icon={node.icon} />
          </icon>
        </TableColumnValue>
        <ItemName node={node} index={0} />
      </TableItem>
    );
  }

  return styled(styles)(
    <TableItem item={objectId}>
      <TableColumnValue centerContent>
        <TableItemSelect />
      </TableColumnValue>
      <TableColumnValue>
        <icon>
          <StaticImage icon={node.icon} />
        </icon>
      </TableColumnValue>
      {dbObject.object.properties.map((property, index) => (
        <ItemName key={property.id} node={node} property={property} index={index} />
      ))}
    </TableItem>
  );
});

interface IItemNameProps {
  index: number;
  node: NavNode;
  property?: ObjectPropertyInfo;
}

const ItemName = observer<IItemNameProps>(function ItemName({
  index,
  node,
  property,
}) {
  const connectionsInfoResource = useService(ConnectionInfoResource);
  const menu = useMenu({ menu: MENU_NAV_TREE });
  menu.context.set(DATA_CONTEXT_NAV_NODE, node);

  const connection = connectionsInfoResource.getConnectionForNode(node.id);

  if (connection) {
    menu.context.set(DATA_CONTEXT_CONNECTION, connection);
  }
  const navNodeManagerService = useService(NavNodeManagerService);
  const styles = useStyles(itemStyles);
  const [menuOpened, switchState] = useState(false);
  const mouse = useMouse<HTMLTableDataCellElement>();

  function openNode() {
    navNodeManagerService.navToNode(node.id, node.parentId);
  }

  const name = property ? getValue(property.value) : node.name;
  const menuAvailable = index === 0;
  const mouseEnter = useStateDelay(menuAvailable && mouse.state.mouseEnter, 33); // track mouse update only 30 times per second

  const isMenuEmpty = !menuOpened && menuAvailable && getComputed(() => {
    if (!mouseEnter) {
      return true;
    }

    return !menu.isAvailable();
  });

  return styled(styles)(
    <TableColumnValue
      ref={mouse.reference}
      onDoubleClick={openNode}
      {...use({ menuAvailable, isMenuEmpty, menuOpened })}
    >
      <menu-box>
        {!isMenuEmpty && menuAvailable && (
          <ContextMenu menu={menu} modal disclosure onVisibleSwitch={switchState}>
            <menu-icon><Icon name="snack" viewBox="0 0 16 10" /></menu-icon>
          </ContextMenu>
        )}
        <menu-name title={name}>{name}</menu-name>
      </menu-box>
    </TableColumnValue>
  );
});
