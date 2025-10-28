/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';

import { Alert, StaticImage, useAutoLoad, useResource, useTranslate } from '@cloudbeaver/core-blocks';
import {
  compareConnectionsInfo,
  ConnectionInfoOriginResource,
  ConnectionInfoProjectKey,
  ConnectionInfoResource,
  DBDriverResource,
  isCloudConnection,
  type DatabaseConnection,
} from '@cloudbeaver/core-connections';
import { isGlobalProject, ProjectInfoResource } from '@cloudbeaver/core-projects';
import { CachedMapAllKey, resourceKeyList } from '@cloudbeaver/core-resource';
import { type TabContainerPanelComponent, useTab, useTabState } from '@cloudbeaver/core-ui';
import { AdminSubjectType } from '@cloudbeaver/core-sdk';
import { GrantManagementTable, type IGrantManagementTableColumn } from '@cloudbeaver/plugin-data-grid';
import { isDefined } from '@dbeaver/js-helpers';

import type { UserFormProps } from '../AdministrationUserFormService.js';
import type { UserFormConnectionAccessPart } from './UserFormConnectionAccessPart.js';
import { getUserFormInfoPart } from '../Info/getUserFormInfoPart.js';

const NAME_COLUMN: IGrantManagementTableColumn = { key: 'name', label: 'connections_connection_name' };
const GRANTED_BY_COLUMN: IGrantManagementTableColumn = {
  key: 'description',
  label: 'authentication_administration_user_connections_access_granted_by',
};

const COLUMNS: IGrantManagementTableColumn[] = [NAME_COLUMN, GRANTED_BY_COLUMN];

export const UserConnectionAccessTable: TabContainerPanelComponent<UserFormProps> = observer(function UserConnectionAccessTable({
  tabId,
  formState,
}) {
  const translate = useTranslate();
  const tab = useTab(tabId);
  const tabState = useTabState<UserFormConnectionAccessPart>();
  const projectLoader = useResource(UserConnectionAccessTable, ProjectInfoResource, CachedMapAllKey, { active: tab.selected });

  const userFormInfoPart = getUserFormInfoPart(formState);
  const key = ConnectionInfoProjectKey(...projectLoader.data.filter(isGlobalProject).map(project => project.id));
  const connectionsLoader = useResource(UserConnectionAccessTable, ConnectionInfoResource, key, { active: tab.selected });
  const connectionsOriginsLoader = useResource(UserConnectionAccessTable, ConnectionInfoOriginResource, key, { active: tab.selected });

  const connectionsOrigins = connectionsOriginsLoader.data.filter(isDefined);
  const isCloud = connectionsOrigins.some(connectionOrigin => isCloudConnection(connectionOrigin.origin));
  const isAdmin = userFormInfoPart.state.teams.includes('admin');

  const items = connectionsLoader.data
    .filter(isDefined)
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

  const driversLoader = useResource(UserConnectionAccessTable, DBDriverResource, resourceKeyList(items.map(connection => connection.driverId)), {
    active: tab.selected,
  });

  useAutoLoad(UserConnectionAccessTable, tabState, tab.selected);
  useAutoLoad(UserConnectionAccessTable, userFormInfoPart, tab.selected);

  if (!tab.selected) {
    return null;
  }

  if (isAdmin) {
    return <Alert className="tw:h-max">{translate('connections_connection_access_admin_info')}</Alert>;
  }

  function isGranted(connection: DatabaseConnection) {
    return tabState.has(connection.id);
  }

  function isEdited(connection: DatabaseConnection) {
    const initial = tabState.initialState.some(permission => permission.dataSourceId === connection.id);
    const current = tabState.state.some(permission => permission.dataSourceId === connection.id);
    return initial !== current;
  }

  function getCell(connection: DatabaseConnection, colKey: string) {
    if (colKey === NAME_COLUMN.key) {
      const driver = driversLoader.data.find(d => d?.id === connection.driverId);

      return (
        <div className="tw:flex tw:items-center tw:gap-2">
          {driver?.icon && <StaticImage className="tw:w-4" icon={driver.icon} />}
          <span className="tw:truncate" title={connection.name}>
            {connection.name}
          </span>
        </div>
      );
    }

    if (colKey === GRANTED_BY_COLUMN.key) {
      const permission = tabState.initialState.find(permission => permission.dataSourceId === connection.id);
      const isTeamProvided = permission?.subjectType === AdminSubjectType.Team;

      let grantedBy = '';

      if (isTeamProvided) {
        grantedBy = `${translate('authentication_administration_user_connections_access_granted_team')} ${permission.subjectId}`;
      } else if (permission) {
        grantedBy = translate('authentication_administration_user_connections_access_granted_directly');
      }

      return <span title={grantedBy}>{grantedBy}</span>;
    }

    return null;
  }

  function isManageable(connection: DatabaseConnection) {
    const permission = tabState.initialState.find(permission => permission.dataSourceId === connection.id);
    const isTeamProvided = permission?.subjectType === AdminSubjectType.Team;
    return !isTeamProvided;
  }

  function grant(ids: string[]) {
    for (const id of ids) {
      tabState.add(id);
    }
  }

  function revoke(ids: string[]) {
    for (const id of ids) {
      tabState.delete(id);
    }
  }

  return (
    <div className="tw:flex tw:flex-col tw:gap-4 tw:overflow-auto">
      {isCloud && <Alert>{translate('cloud_connections_access_placeholder')}</Alert>}
      <GrantManagementTable
        items={items}
        columns={COLUMNS}
        getItemId={item => item.id}
        isGranted={isGranted}
        isEdited={isEdited}
        isManageable={isManageable}
        isVisible={(item, filter) => item.name.toLowerCase().includes(filter.toLowerCase())}
        getCell={getCell}
        disabled={formState.isDisabled}
        onGrant={grant}
        onRevoke={revoke}
      />
    </div>
  );
});
