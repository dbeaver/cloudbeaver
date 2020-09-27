/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';
import { useCallback } from 'react';
import styled, { css } from 'reshadow';

import { NavNodeManagerService, useDatabaseObjectInfo, useNode } from '@cloudbeaver/core-app';
import {
  StaticImage, TableItem, TableColumnValue, TableItemSelect
} from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
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
    TableColumnValue:nth-child(3) {
      cursor: pointer;
      user-select: none;
    }
  `;

type ItemProps = {
  objectId: string;
  columns: number;
}

export const Item = observer(function Item({
  objectId, columns,
}: ItemProps) {
  const navNodeManagerService = useService(NavNodeManagerService);
  const { node } = useNode(objectId);
  const { dbObject } = useDatabaseObjectInfo(objectId);
  const handleOpen = useCallback(() => navNodeManagerService.navToNode(node!.id, node!.parentId), [node]);

  if (!node) {
    return styled(useStyles(itemStyles))(
      <TableItem item={objectId}>
        <TableColumnValue centerContent><TableItemSelect /></TableColumnValue>
        <TableColumnValue>
          <icon as="div">
            <placeholder as="div" />
          </icon>
        </TableColumnValue>
        {Array(columns)
          .fill(0)
          .map((_, i) => (
            <TableColumnValue key={i} onDoubleClick={handleOpen}>
              <placeholder as="div" />
            </TableColumnValue>
          ))}
      </TableItem>
    );
  }

  if (!dbObject?.properties) {
    return styled(useStyles(itemStyles))(
      <TableItem item={objectId}>
        <TableColumnValue centerContent><TableItemSelect /></TableColumnValue>
        <TableColumnValue>
          <icon as="div">
            <StaticImage icon={node.icon} />
          </icon>
        </TableColumnValue>
        <TableColumnValue onDoubleClick={handleOpen}>{node.name}</TableColumnValue>
      </TableItem>
    );
  }

  return styled(useStyles(itemStyles))(
    <TableItem item={objectId}>
      <TableColumnValue centerContent><TableItemSelect /></TableColumnValue>
      <TableColumnValue>
        <icon as="div">
          <StaticImage icon={node.icon} />
        </icon>
      </TableColumnValue>
      {dbObject.properties.map(property => (
        <TableColumnValue key={property.id} onDoubleClick={handleOpen}>{getValue(property.value)}</TableColumnValue>
      ))}
    </TableItem>
  );
});
