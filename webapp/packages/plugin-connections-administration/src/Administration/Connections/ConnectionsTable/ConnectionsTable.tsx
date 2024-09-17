/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { Table, TableBody, TableColumnHeader, TableHeader, TableSelect, useResource, useTranslate } from '@cloudbeaver/core-blocks';
import { ConnectionInfoOriginResource, DBDriverResource, serializeConnectionParam } from '@cloudbeaver/core-connections';
import { useService } from '@cloudbeaver/core-di';
import { isGlobalProject, isSharedProject, ProjectsService } from '@cloudbeaver/core-projects';
import { CachedMapAllKey } from '@cloudbeaver/core-resource';
import { DatabaseConnectionOriginFragment } from '@cloudbeaver/core-sdk';

import { Connection } from './Connection';
import { IConnectionsTableState } from './useConnectionsTable';

interface Props {
  state: IConnectionsTableState;
}

export const ConnectionsTable = observer<Props>(function ConnectionsTable({ state }) {
  const translate = useTranslate();
  const projectService = useService(ProjectsService);
  const dbDriverResource = useResource(ConnectionsTable, DBDriverResource, CachedMapAllKey);
  const shouldDisplayProjects = projectService.activeProjects.filter(project => isGlobalProject(project) || isSharedProject(project)).length > 1;
  const connectionOriginResource = useResource(ConnectionsTable, ConnectionInfoOriginResource, CachedMapAllKey);
  const connectionOriginsMap: Map<string, DatabaseConnectionOriginFragment> = connectionOriginResource.data.reduce((acc, origin) => {
    if (origin?.id) {
      acc.set(origin.id, origin);
    }

    return acc;
  }, new Map());

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
        {shouldDisplayProjects && <TableColumnHeader>{translate('connections_connection_project')}</TableColumnHeader>}
        <TableColumnHeader />
      </TableHeader>
      <TableBody>
        {state.connections.map((connection, i) => (
          <Connection
            key={serializeConnectionParam(state.keys[i])}
            connectionKey={state.keys[i]}
            connection={connection}
            connectionOrigin={connectionOriginsMap.get(connection.id)}
            shouldDisplayProject={shouldDisplayProjects}
            icon={dbDriverResource.resource.get(connection.driverId)?.icon}
          />
        ))}
      </TableBody>
    </Table>
  );
});
