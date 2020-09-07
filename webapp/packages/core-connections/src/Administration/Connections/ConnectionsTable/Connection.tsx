/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';
import styled, { use, css } from 'reshadow';

import {
  TableItem, TableColumnValue, TableItemSelect, TableItemExpand, StaticImage
} from '@cloudbeaver/core-blocks';
import { DBDriverResource } from '@cloudbeaver/core-connections';
import { useService } from '@cloudbeaver/core-di';
import { useTranslate } from '@cloudbeaver/core-localization';
import { ConnectionInfo } from '@cloudbeaver/core-sdk';
import { useStyles } from '@cloudbeaver/core-theming';

import { ConnectionsResource, isSearchedConnection, SEARCH_CONNECTION_SYMBOL } from '../../ConnectionsResource';
import { ConnectionEdit } from './ConnectionEdit';

type Props = {
  connection: ConnectionInfo;
}

const styles = css`
  StaticImage {
    display: flex;
    width: 24px;

    &:not(:last-child) {
      margin-right: 16px;
    }
  }
  TableColumnValue[expand] {
    cursor: pointer;
  }
`;

export const Connection = observer(function Connection({ connection }: Props) {
  const driversResource = useService(DBDriverResource);
  const icon = driversResource.get(connection.driverId)?.icon;

  return styled(useStyles(styles))(
    <TableItem item={connection.id} expandElement={ConnectionEdit}>
      <TableColumnValue centerContent flex>
        <TableItemSelect />
      </TableColumnValue>
      <TableColumnValue centerContent flex expand>
        <TableItemExpand />
      </TableColumnValue>
      <TableColumnValue centerContent flex expand>
        <StaticImage icon={icon} />
      </TableColumnValue>
      <TableColumnValue expand>{connection.name}</TableColumnValue>
      <TableColumnValue>{connection.host}{connection.host && connection.port && `:${connection.port}`}</TableColumnValue>
      <TableColumnValue><input type="checkbox" checked={connection.template} disabled/></TableColumnValue>
      <TableColumnValue/>
    </TableItem>
  );
});
