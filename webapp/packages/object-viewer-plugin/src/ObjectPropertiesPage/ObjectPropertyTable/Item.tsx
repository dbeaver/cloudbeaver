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

import { NodesManagerService, useDatabaseObjectInfo, useNode } from '@dbeaver/core/app';
import {
  StaticImage, TableItem, TableColumnValue, TableItemSelect
} from '@dbeaver/core/blocks';
import { useService } from '@dbeaver/core/di';
import { useStyles } from '@dbeaver/core/theming';

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
  const nodesManagerService = useService(NodesManagerService);
  const object = useNode(objectId);
  const databaseObjectInfo = useDatabaseObjectInfo(objectId);
  const handleOpen = useCallback(() => nodesManagerService.navToNode(objectId), [objectId]);

  if (!object || !databaseObjectInfo?.properties) {
    return styled(useStyles(itemStyles))(
      <TableItem item={objectId} onDoubleClick={handleOpen}>
        <TableColumnValue centerContent><TableItemSelect /></TableColumnValue>
        <TableColumnValue>
          <icon as="div">
            <placeholder as="div" />
          </icon>
        </TableColumnValue>
        {Array(columns)
          .fill(0)
          .map((_, i) => (
            <TableColumnValue key={i}>
              <placeholder as="div" />
            </TableColumnValue>
          ))}
      </TableItem>
    );
  }

  return styled(useStyles(itemStyles))(
    <TableItem item={objectId} onDoubleClick={handleOpen}>
      <TableColumnValue centerContent><TableItemSelect /></TableColumnValue>
      <TableColumnValue>
        <icon as="div">
          <StaticImage icon={object.icon} />
        </icon>
      </TableColumnValue>
      {databaseObjectInfo.properties.map(property => (
        <TableColumnValue key={property.id}>{getValue(property.value)}</TableColumnValue>
      ))}
    </TableItem>
  );
});
