/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';
import { useCallback } from 'react';
import styled, { css, use } from 'reshadow';

import { NodesManagerService, useDatabaseObjectInfo, useNode } from '@dbeaver/core/app';
import { StaticImage } from '@dbeaver/core/blocks';
import { useService } from '@dbeaver/core/di';
import { useStyles } from '@dbeaver/core/theming';

import { getValue } from '../tools';

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
    tr {
      position: relative;
    }
    td:nth-child(2) {
      cursor: pointer;
      user-select: none;
    }
  `;

type ItemProps = {
  objectId: string;
  columns: number;
  isSelected: boolean;
  onClick: (objectId: string, isMultiple: boolean) => void;
}

export const Item = observer(function Item({
  objectId, columns, isSelected, onClick,
}: ItemProps) {
  const nodesManagerService = useService(NodesManagerService);
  const object = useNode(objectId);
  const databaseObjectInfo = useDatabaseObjectInfo(objectId);
  const handleOpen = useCallback(() => nodesManagerService.navToNode(objectId), [objectId]);
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLTableRowElement>) => onClick(objectId, e.ctrlKey),
    [objectId, onClick]
  );

  if (!object || !databaseObjectInfo?.properties) {
    return styled(useStyles(itemStyles))(
      <tr tabIndex={0} onDoubleClick={handleOpen} onClick={handleClick} {...use({ isSelected })}>
        <td>
          <icon as="div">
            <placeholder as="div" />
          </icon>
        </td>
        {Array(columns)
          .fill(0)
          .map((_, i) => (
            <td key={i}>
              <placeholder as="div" />
            </td>
          ))}
      </tr>
    );
  }

  return styled(useStyles(itemStyles))(
    <tr tabIndex={0} onDoubleClick={handleOpen} onClick={handleClick} {...use({ isSelected })}>
      <td>
        <icon as="div">
          <StaticImage icon={object.icon} />
        </icon>
      </td>
      {databaseObjectInfo.properties.map(property => (
        <td key={property.id}>{getValue(property.value)}</td>
      ))}
    </tr>
  );
});
