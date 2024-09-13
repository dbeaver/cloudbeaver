/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useMemo } from 'react';

import { getComputed, Table, TableBody, TableColumnHeader, TableHeader, TableSelect, useResource, useTranslate } from '@cloudbeaver/core-blocks';
import { DatabaseConnection, IConnectionInfoParams, serializeConnectionParam } from '@cloudbeaver/core-connections';
import { useService } from '@cloudbeaver/core-di';
import { isGlobalProject, isSharedProject, ProjectInfoResource, ProjectsService } from '@cloudbeaver/core-projects';
import { CachedMapAllKey } from '@cloudbeaver/core-resource';
import { DatabaseConnectionOriginFragment } from '@cloudbeaver/core-sdk';

import { Connection } from './Connection';

interface Props {
  keys: IConnectionInfoParams[];
  connections: DatabaseConnection[];
  connectionsOrigins: DatabaseConnectionOriginFragment[];
  selectedItems: Map<IConnectionInfoParams, boolean>;
  expandedItems: Map<IConnectionInfoParams, boolean>;
}

export const ConnectionsTable = observer<Props>(function ConnectionsTable({ keys, connectionsOrigins, connections, selectedItems, expandedItems }) {
  const translate = useTranslate();
  const projectService = useService(ProjectsService);
  const projectsLoader = useResource(ConnectionsTable, ProjectInfoResource, CachedMapAllKey);
  const displayProjects = getComputed(
    () => projectService.activeProjects.filter(project => isGlobalProject(project) || isSharedProject(project)).length > 1,
  );
  const connectionsOriginMap = useMemo(
    () =>
      getComputed(() =>
        connectionsOrigins.reduce((map, origin) => {
          map.set(origin.id, origin);
          return map;
        }, new Map()),
      ),
    [connectionsOrigins],
  );

  function getProjectName(projectId: string) {
    return displayProjects ? (projectsLoader.resource.get(projectId)?.name ?? null) : undefined;
  }

  return (
    <Table keys={keys} selectedItems={selectedItems} expandedItems={expandedItems} size="big">
      <TableHeader fixed>
        <TableColumnHeader min flex centerContent>
          <TableSelect />
        </TableColumnHeader>
        <TableColumnHeader min />
        <TableColumnHeader min />
        <TableColumnHeader>{translate('connections_connection_name')}</TableColumnHeader>
        <TableColumnHeader>{translate('connections_connection_address')}</TableColumnHeader>
        {displayProjects && <TableColumnHeader>{translate('connections_connection_project')}</TableColumnHeader>}
        <TableColumnHeader />
      </TableHeader>
      <TableBody>
        {connections.map((connection, i) => (
          <Connection
            key={serializeConnectionParam(keys[i])}
            connectionKey={keys[i]}
            connection={connection}
            connectionOrigin={connectionsOriginMap.get(connection.id)}
            projectName={getProjectName(connection.projectId)}
          />
        ))}
      </TableBody>
    </Table>
  );
});
