/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { Table, TableBody, TableColumnHeader, TableHeader, TableSelect, useTranslate } from '@cloudbeaver/core-blocks';
import { serializeConnectionParam } from '@cloudbeaver/core-connections';

import { Connection } from './Connection';
import { IConnectionsTableState } from './useConnectionsTable';

interface Props {
  state: IConnectionsTableState;
}

export const ConnectionsTable = observer<Props>(function ConnectionsTable({ state }) {
  const translate = useTranslate();

  return (
    <Table keys={state.keys} selectedItems={state.table.selected} expandedItems={state.table.expanded} size="big">
      <TableHeader fixed>
        <TableColumnHeader min flex centerContent>
          <TableSelect />
        </TableColumnHeader>
        <TableColumnHeader min />
        <TableColumnHeader min />
        <TableColumnHeader>{translate('connections_connection_name')}</TableColumnHeader>
        <TableColumnHeader>{translate('connections_connection_address')}</TableColumnHeader>
        {state.shouldDisplayProjects && <TableColumnHeader>{translate('connections_connection_project')}</TableColumnHeader>}
        <TableColumnHeader />
      </TableHeader>
      <TableBody>
        {state.connections.map((connection, i) => (
          <Connection
            key={serializeConnectionParam(state.keys[i])}
            connectionKey={state.keys[i]}
            connection={connection}
            projectName={state.shouldDisplayProjects ? (state.getProjectName(connection.projectId) ?? '') : undefined}
            icon={state.getConnectionIcon(connection)}
          />
        ))}
      </TableBody>
    </Table>
  );
});
