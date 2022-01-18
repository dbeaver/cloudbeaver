/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled, { css } from 'reshadow';

import {
  TableItem, TableColumnValue, TableItemSelect, TableItemExpand, StaticImage, Placeholder
} from '@cloudbeaver/core-blocks';
import { DatabaseConnection, DBDriverResource } from '@cloudbeaver/core-connections';
import { useService } from '@cloudbeaver/core-di';
import { useStyles } from '@cloudbeaver/core-theming';

import { ConnectionsAdministrationService } from '../ConnectionsAdministrationService';
import { ConnectionEdit } from './ConnectionEdit';

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
  Checkbox {
    margin-left: -10px;
    margin-right: -10px;
  }
`;

interface Props {
  connection: DatabaseConnection;
}

export const Connection = observer<Props>(function Connection({ connection }) {
  const driversResource = useService(DBDriverResource);
  const connectionsAdministrationService = useService(ConnectionsAdministrationService);
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
      <TableColumnValue title={connection.name} expand ellipsis>{connection.name}</TableColumnValue>
      <TableColumnValue>{connection.host}{connection.host && connection.port && `:${connection.port}`}</TableColumnValue>
      <TableColumnValue flex>
        <Placeholder
          container={connectionsAdministrationService.connectionDetailsPlaceholder}
          connection={connection}
        />
      </TableColumnValue>
    </TableItem>
  );
});
