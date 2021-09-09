/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useState } from 'react';
import styled, { css, use } from 'reshadow';

import { NavNode, NavNodeContextMenuService, NavNodeManagerService, useDatabaseObjectInfo, useNode } from '@cloudbeaver/core-app';
import {
  StaticImage, TableItem, TableColumnValue, TableItemSelect, useMouse, getComputed, Icon, useStateDelay
} from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { MenuTrigger } from '@cloudbeaver/core-dialogs';
import type { ObjectPropertyInfo } from '@cloudbeaver/core-sdk';
import { useStyles } from '@cloudbeaver/core-theming';

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
  objectId: string;
  columns: number;
}

export const Item = observer<Props>(function Item({
  objectId, columns,
}) {
  const styles = useStyles(itemStyles);

  const { node } = useNode(objectId);
  const { dbObject } = useDatabaseObjectInfo(objectId);

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

  if (!dbObject?.properties || dbObject.properties.length === 0) {
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
      {dbObject.properties.map((property, index) => (
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
  const navNodeContextMenuService = useService(NavNodeContextMenuService);
  const navNodeManagerService = useService(NavNodeManagerService);
  const styles = useStyles(itemStyles);
  const [menuOpened, switchState] = useState(false);
  const mouse = useMouse<HTMLTableDataCellElement>();

  function getPanel() {
    return navNodeContextMenuService.constructMenuWithContext(node);
  }

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

    const panel = getPanel();

    return !panel.menuItems.length || panel.menuItems.every(item => item.isHidden);
  });

  return styled(styles)(
    <TableColumnValue
      ref={mouse.reference}
      onDoubleClick={openNode}
      {...use({ menuAvailable, isMenuEmpty, menuOpened })}
    >
      <menu-box>
        {!isMenuEmpty && menuAvailable && (
          <MenuTrigger getPanel={getPanel} modal disclosure onVisibleSwitch={switchState}>
            <menu-icon><Icon name="snack" viewBox="0 0 16 10" /></menu-icon>
          </MenuTrigger>
        )}
        <menu-name>{name}</menu-name>
      </menu-box>
    </TableColumnValue>
  );
});
