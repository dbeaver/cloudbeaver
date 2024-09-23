/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import {
  Loader,
  Placeholder,
  s,
  StaticImage,
  TableColumnValue,
  TableItem,
  TableItemExpand,
  TableItemSelect,
  useResource,
  useS,
} from '@cloudbeaver/core-blocks';
import { type ConnectionInfoOrigin, type DatabaseConnection, type IConnectionInfoParams } from '@cloudbeaver/core-connections';
import { useService } from '@cloudbeaver/core-di';
import { ProjectInfoResource } from '@cloudbeaver/core-projects';

import { ConnectionsAdministrationService } from '../ConnectionsAdministrationService.js';
import styles from './Connection.module.css';
import { ConnectionEdit } from './ConnectionEdit.js';

interface Props {
  connectionKey: IConnectionInfoParams;
  connection: DatabaseConnection;
  shouldDisplayProject: boolean;
  connectionOrigin?: ConnectionInfoOrigin;
  icon?: string;
}

export const Connection = observer<Props>(function Connection({ connectionKey, connectionOrigin, connection, shouldDisplayProject, icon }) {
  const style = useS(styles);
  const connectionsAdministrationService = useService(ConnectionsAdministrationService);
  const projectInfoResource = useResource(Connection, ProjectInfoResource, connectionKey.projectId, { active: shouldDisplayProject });

  const projectName = shouldDisplayProject ? (projectInfoResource.data?.name ?? '') : undefined;

  return (
    <TableItem item={connectionKey} expandElement={ConnectionEdit}>
      <TableColumnValue centerContent flex>
        <TableItemSelect className={s(style, { tableItemSelect: true })} />
      </TableColumnValue>
      <TableColumnValue className={s(style, { tableColumnValueExpand: true })} centerContent flex expand>
        <TableItemExpand />
      </TableColumnValue>
      <TableColumnValue className={s(style, { tableColumnValueExpand: true })} centerContent flex expand>
        <StaticImage className={s(style, { staticImage: true })} icon={icon} />
      </TableColumnValue>
      <TableColumnValue title={connection.name} className={s(style, { tableColumnValueExpand: true })} expand ellipsis>
        {connection.name}
      </TableColumnValue>
      <TableColumnValue>
        {connection.host}
        {connection.host && connection.port && `:${connection.port}`}
      </TableColumnValue>
      {projectName !== undefined && (
        <TableColumnValue title={projectName} className={s(style, { tableColumnValueExpand: true })} expand ellipsis>
          {projectName}
        </TableColumnValue>
      )}
      <TableColumnValue flex>
        <Loader suspense small inline hideMessage>
          <Placeholder
            container={connectionsAdministrationService.connectionDetailsPlaceholder}
            connectionOrigin={connectionOrigin}
            connection={connection}
          />
        </Loader>
      </TableColumnValue>
    </TableItem>
  );
});
