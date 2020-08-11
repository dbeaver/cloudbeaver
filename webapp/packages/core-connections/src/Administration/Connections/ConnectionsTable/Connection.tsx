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
  TableItem, TableColumnValue, TableItemSelect, TableItemExpand
} from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { ConnectionInfo } from '@cloudbeaver/core-sdk';
import { useStyles, composes } from '@cloudbeaver/core-theming';

import { ConnectionsResource } from '../../ConnectionsResource';
import { ConnectionEdit } from './ConnectionEdit';

const styles = composes(
  css`
    TableColumnValue {
      composes: theme-border-color-color-positive from global;
    }
  `,
  css`
    [|new] {
      border-left: solid 3px;
    }
  `
);

type Props = {
  connection: ConnectionInfo;
}

export const Connection = observer(function Connection({ connection }: Props) {
  const connectionInfoResource = useService(ConnectionsResource);
  const isNew = connectionInfoResource.isNew(connection.id);

  return styled(useStyles(styles))(
    <TableItem item={connection.id} expandElement={ConnectionEdit}>
      <TableColumnValue centerContent flex {...use({ new: isNew })}>
        <TableItemSelect />
        <TableItemExpand />
      </TableColumnValue>
      <TableColumnValue>{connection.name}</TableColumnValue>
      <TableColumnValue>{connection.host}</TableColumnValue>
      <TableColumnValue>{connection.port}</TableColumnValue>
      <TableColumnValue><input type="checkbox" checked={connection.template === false} disabled/></TableColumnValue>
      <TableColumnValue></TableColumnValue>
    </TableItem>
  );
});
