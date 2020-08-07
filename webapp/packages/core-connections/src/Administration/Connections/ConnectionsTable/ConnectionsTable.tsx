/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';
import styled, { css } from 'reshadow';

import {
  Table, TableHeader, TableColumnHeader, TableBody
} from '@cloudbeaver/core-blocks';
import { useTranslate } from '@cloudbeaver/core-localization';
import { ConnectionInfo } from '@cloudbeaver/core-sdk';
import { useStyles, composes } from '@cloudbeaver/core-theming';

import { Connection } from './Connection';

const styles = composes(
  css``,
  css`
    TableColumnHeader {
      border-top: solid 1px;
    }
  `
);

type Props = {
  connections: ConnectionInfo[];
  selectedItems: Map<string, boolean>;
}

export const ConnectionsTable = observer(function ConnectionsTable({ connections, selectedItems }: Props) {
  const translate = useTranslate();
  return styled(useStyles(styles))(
    <Table selectedItems={selectedItems}>
      <TableHeader>
        <TableColumnHeader min/>
        <TableColumnHeader>{translate('connections_connection_name')}</TableColumnHeader>
        <TableColumnHeader>{translate('connections_connection_host')}</TableColumnHeader>
        <TableColumnHeader>{translate('connections_connection_port')}</TableColumnHeader>
        <TableColumnHeader>{translate('connections_connection_in_tree')}</TableColumnHeader>
        <TableColumnHeader></TableColumnHeader>
      </TableHeader>
      <TableBody>
        {connections.map(connection => <Connection key={connection.id} connection={connection}/>)}
      </TableBody>
    </Table>
  );
});
