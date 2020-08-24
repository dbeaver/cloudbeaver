/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';
import styled, { css, use } from 'reshadow';

import {
  Table, TableHeader, TableColumnHeader, TableBody, TableItemSeparator
} from '@cloudbeaver/core-blocks';
import { useTranslate } from '@cloudbeaver/core-localization';
import { ConnectionInfo } from '@cloudbeaver/core-sdk';
import { useStyles, composes } from '@cloudbeaver/core-theming';

import { ConnectionSearch } from '../../ConnectionsResource';
import { Connection } from './Connection';

const styles = composes(
  css`
    TableItemSeparator {
      composes: theme-background-secondary from global;
    }
  `,
  css`
    TableColumnHeader {
      border-top: solid 1px;
    }
    TableItemSeparator {
      text-align: center;
    }
  `
);

type Props = {
  connections: ConnectionInfo[];
  findConnections: ConnectionSearch[];
  selectedItems: Map<string, boolean>;
  expandedItems: Map<string, boolean>;
}

export const ConnectionsTable = observer(function ConnectionsTable({
  connections,
  findConnections,
  selectedItems,
  expandedItems,
}: Props) {
  const translate = useTranslate();

  return styled(useStyles(styles))(
    <Table selectedItems={selectedItems} expandedItems={expandedItems} {...use({ size: 'big' })}>
      <TableHeader>
        <TableColumnHeader min/>
        <TableColumnHeader min/>
        <TableColumnHeader min/>
        <TableColumnHeader>{translate('connections_connection_name')}</TableColumnHeader>
        <TableColumnHeader>{translate('connections_connection_address')}</TableColumnHeader>
        <TableColumnHeader>{translate('connections_connection_template')}</TableColumnHeader>
        <TableColumnHeader></TableColumnHeader>
      </TableHeader>
      <TableBody>
        {findConnections.map(connection => <Connection key={connection.id} connection={connection}/>)}
        {!!findConnections.length && <TableItemSeparator key='search' colSpan={7}></TableItemSeparator>}
        {connections.map(connection => <Connection key={connection.id} connection={connection}/>)}
      </TableBody>
    </Table>
  );
});
