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
  Table, TableHeader, TableColumnHeader, TableBody, TableSelect
} from '@cloudbeaver/core-blocks';
import type { DatabaseConnection } from '@cloudbeaver/core-connections';
import { useTranslate } from '@cloudbeaver/core-localization';
import { useStyles } from '@cloudbeaver/core-theming';

import { Connection } from './Connection';

const styles = css`
    Table {
      width: 100%;
    }
    TableItemSeparator {
      composes: theme-background-secondary from global;
      text-align: center;
    }
  `;

interface Props {
  connections: DatabaseConnection[];
  selectedItems: Map<string, boolean>;
  expandedItems: Map<string, boolean>;
}

export const ConnectionsTable = observer<Props>(function ConnectionsTable({
  connections,
  selectedItems,
  expandedItems,
}) {
  const translate = useTranslate();
  const keys = connections.map(connection => connection.id);

  return styled(useStyles(styles))(
    <Table keys={keys} selectedItems={selectedItems} expandedItems={expandedItems} size='big'>
      <TableHeader>
        <TableColumnHeader min flex centerContent>
          <TableSelect />
        </TableColumnHeader>
        <TableColumnHeader min />
        <TableColumnHeader min />
        <TableColumnHeader>{translate('connections_connection_name')}</TableColumnHeader>
        <TableColumnHeader>{translate('connections_connection_address')}</TableColumnHeader>
        <TableColumnHeader />
      </TableHeader>
      <TableBody>
        {connections.map(connection => <Connection key={connection.id} connection={connection} />)}
      </TableBody>
    </Table>
  );
});
