/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';

import { useTab, useTabState, type TabContainerPanelComponent } from '@cloudbeaver/core-ui';
import {
  compareConnectionsInfo,
  ConnectionInfoCustomOptionsResource,
  ConnectionInfoOriginResource,
  ConnectionInfoProjectKey,
  DBDriverResource,
  isCloudConnection,
  type ConnectionInfoCustomOptions,
  type ConnectionInfoOrigin,
} from '@cloudbeaver/core-connections';
import type { DatabaseConnectionCustomOptionsFragment } from '@cloudbeaver/core-sdk';
import { Alert, StaticImage, useAutoLoad, useResource, useTranslate } from '@cloudbeaver/core-blocks';
import { isGlobalProject, ProjectInfoResource, type ProjectInfo } from '@cloudbeaver/core-projects';
import { CachedMapAllKey } from '@cloudbeaver/core-resource';
import { GrantManagementTable } from '@cloudbeaver/plugin-data-grid';

import type { TeamFormProps } from '../TeamsAdministrationFormService.js';
import type { GrantedConnectionsFormPart } from './GrantedConnectionsFormPart.js';

const COLUMNS = [
  { key: 'name', label: 'connections_connection_name' },
  { key: 'address', label: 'connections_connection_address' },
];

export const ConnectionManagement: TabContainerPanelComponent<TeamFormProps> = observer(function ConnectionManagement({ tabId, formState }) {
  const translate = useTranslate();
  const tabState = useTabState<GrantedConnectionsFormPart>();
  const { selected } = useTab(tabId);

  const driverLoader = useResource(ConnectionManagement, DBDriverResource, CachedMapAllKey, { active: selected });

  const projects = useResource(ConnectionManagement, ProjectInfoResource, CachedMapAllKey);

  const loaded = tabState.isLoaded();
  const key = ConnectionInfoProjectKey(...(projects.data as Array<ProjectInfo | undefined>).filter(isGlobalProject).map(project => project.id));

  const connectionLoader = useResource(ConnectionManagement, ConnectionInfoCustomOptionsResource, key, { active: selected });
  const connectionsOriginLoader = useResource(ConnectionManagement, ConnectionInfoOriginResource, key, { active: selected });

  const connections = connectionLoader.data as ConnectionInfoCustomOptions[];
  const connectionsOrigins = (connectionsOriginLoader.data ?? []) as ConnectionInfoOrigin[];

  useAutoLoad(ConnectionManagement, tabState, selected && !loaded);

  if (!selected) {
    return null;
  }

  function isGranted(connection: DatabaseConnectionCustomOptionsFragment) {
    return tabState.state.grantedSubjects.includes(connection.id);
  }

  function isEdited(connection: DatabaseConnectionCustomOptionsFragment) {
    return tabState.initialState.grantedSubjects.includes(connection.id) !== isGranted(connection);
  }

  function getCell(connection: DatabaseConnectionCustomOptionsFragment, colKey: string) {
    const column = COLUMNS.find(c => c.key === colKey)!;
    const driver = driverLoader.data.find(d => d?.id === connection.driverId);

    if (column.key === 'name') {
      return (
        <div title={connection.name} className="tw:font-medium tw:flex tw:items-center tw:gap-2">
          {driver?.icon && <StaticImage className="tw:w-4" icon={driver.icon} />}
          <span className="tw:truncate">{connection.name}</span>
        </div>
      );
    }

    if (column.key === 'address') {
      return (
        <div className="tw:text-(--theme-text-hint-on-light)">
          {connection.host}:{connection.port}
        </div>
      );
    }

    return connection.id;
  }

  const isCloud = connectionsOrigins.some(connectionOrigin => isCloudConnection(connectionOrigin.origin));
  const items = connections
    .filter(connection => {
      if (isCloud) {
        const originDetails = connectionsOrigins.find(c => c.id === connection.id);

        if (originDetails) {
          return !isCloudConnection(originDetails.origin);
        }
      }

      return true;
    })
    .sort(compareConnectionsInfo);

  return (
    <div className="tw:flex tw:flex-col tw:gap-4 tw:overflow-auto">
      {isCloud && <Alert>{translate('cloud_connections_access_placeholder')}</Alert>}
      <GrantManagementTable
        items={items}
        columns={COLUMNS}
        getItemId={item => item.id}
        isGranted={isGranted}
        isEdited={isEdited}
        isVisible={(item, filter) => item.name.toLowerCase().includes(filter.toLowerCase())}
        getCell={getCell}
        disabled={formState.isDisabled}
        onGrant={tabState.grant}
        onRevoke={tabState.revoke}
      />
    </div>
  );
});
