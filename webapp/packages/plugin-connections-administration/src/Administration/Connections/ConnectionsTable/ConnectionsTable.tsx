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
  Table, TableHeader, TableColumnHeader, TableBody, TableSelect, useTranslate
} from '@cloudbeaver/core-blocks';
import { DatabaseConnection, IConnectionInfoParams, serializeConnectionParam } from '@cloudbeaver/core-connections';
import { useService } from '@cloudbeaver/core-di';
import { ProjectsService } from '@cloudbeaver/core-projects';

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
  keys: IConnectionInfoParams[];
  connections: DatabaseConnection[];
  selectedItems: Map<IConnectionInfoParams, boolean>;
  expandedItems: Map<IConnectionInfoParams, boolean>;
}

export const ConnectionsTable = observer<Props>(function ConnectionsTable({
  keys,
  connections,
  selectedItems,
  expandedItems,
}) {
  const translate = useTranslate();
  const projectService = useService(ProjectsService);
  const sharedNonGlobalProjects = projectService.activeProjects.filter(project => project.shared && !project.global);

  const getProjectName = (projectId: string) => {
    if (sharedNonGlobalProjects.length > 1) {
      return sharedNonGlobalProjects.find(project => project.id === projectId)?.name;
    }
    return null;
  };

  return styled(styles)(
    <Table keys={keys} selectedItems={selectedItems} expandedItems={expandedItems} size='big'>
      <TableHeader>
        <TableColumnHeader min flex centerContent>
          <TableSelect />
        </TableColumnHeader>
        <TableColumnHeader min />
        <TableColumnHeader min />
        <TableColumnHeader>{translate('connections_connection_name')}</TableColumnHeader>
        <TableColumnHeader>{translate('connections_connection_address')}</TableColumnHeader>
        <TableColumnHeader>{translate('connections_connection_folder')}</TableColumnHeader>
        {sharedNonGlobalProjects.length > 1 && <TableColumnHeader>{translate('connections_connection_project')}</TableColumnHeader>}
        <TableColumnHeader />
      </TableHeader>
      <TableBody>
        {connections.map((connection, i) => (
          <Connection
            key={serializeConnectionParam(keys[i])}
            connectionKey={keys[i]}
            connection={connection}
            projectName={getProjectName(connection.projectId)}
          />
        ))}
      </TableBody>
    </Table>
  );
});
