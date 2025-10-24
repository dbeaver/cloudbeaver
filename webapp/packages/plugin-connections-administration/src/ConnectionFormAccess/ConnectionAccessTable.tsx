/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';

import { Alert, StaticImage, useAutoLoad, useResource, useTranslate } from '@cloudbeaver/core-blocks';
import { useTab, type TabContainerPanelComponent } from '@cloudbeaver/core-ui';
import { getConnectionFormOptionsPart, type IConnectionFormProps } from '@cloudbeaver/plugin-connections';
import { CachedMapAllKey, CachedResourceOffsetPageListKey } from '@cloudbeaver/core-resource';
import { TeamsResource, UsersResource, UsersResourceFilterKey, type AdminUser, type TeamInfo } from '@cloudbeaver/core-authentication';
import { ConnectionInfoOriginResource, ConnectionInfoResource, createConnectionParam, isCloudConnection } from '@cloudbeaver/core-connections';
import { GrantManagementTable, type IGrantManagementTableColumn } from '@cloudbeaver/plugin-data-grid';

import { getConnectionFormAccessPart } from './getConnectionFormAccessPart.js';

const NAME_COLUMN: IGrantManagementTableColumn = { key: 'name', label: 'connections_connection_access_user_or_team_name' };
const DESCRIPTION_COLUMN: IGrantManagementTableColumn = { key: 'description', label: 'connections_connection_description' };

const COLUMNS: IGrantManagementTableColumn[] = [NAME_COLUMN, DESCRIPTION_COLUMN];

export const ConnectionAccessTable: TabContainerPanelComponent<IConnectionFormProps> = observer(function ConnectionAccessTable({ tabId, formState }) {
  const translate = useTranslate();
  const { selected } = useTab(tabId);
  const accessPart = getConnectionFormAccessPart(formState);

  useAutoLoad(ConnectionAccessTable, accessPart, selected);

  const userLoader = useResource(ConnectionAccessTable, UsersResource, CachedResourceOffsetPageListKey(0, 1000).setParent(UsersResourceFilterKey()), {
    active: selected,
  });

  const teamLoader = useResource(ConnectionAccessTable, TeamsResource, CachedMapAllKey, { active: selected });

  const optionsPart = getConnectionFormOptionsPart(formState);
  const connectionParam =
    optionsPart.state.connectionId !== undefined ? createConnectionParam(formState.state.projectId, optionsPart.state.connectionId) : null;
  const connectionInfoResource = useResource(ConnectionAccessTable, ConnectionInfoResource, connectionParam, {
    active: selected,
  });
  const originInfoResource = useResource(ConnectionAccessTable, ConnectionInfoOriginResource, connectionParam, {
    active: selected,
  });

  if (!selected) {
    return null;
  }

  const connectionInfo = connectionInfoResource.data;
  const originInfo = originInfoResource.data;

  const cloud = connectionInfo && originInfo?.origin ? isCloudConnection(originInfo.origin) : false;

  if (cloud) {
    return <Alert className="tw:h-max tw:m-4">{translate('cloud_connections_access_placeholder')}</Alert>;
  }

  const users = userLoader.data as AdminUser[];
  const teams = teamLoader.data as TeamInfo[];
  const items: Array<AdminUser | TeamInfo> = [...users, ...teams];

  function isGranted(item: AdminUser | TeamInfo) {
    const id = 'teamId' in item ? item.teamId : item.userId;
    return accessPart.state.includes(id);
  }

  function isEdited(item: AdminUser | TeamInfo) {
    const id = 'teamId' in item ? item.teamId : item.userId;
    const initial = accessPart.initialState.includes(id);
    const current = accessPart.state.includes(id);

    return initial !== current;
  }

  function getCell(item: AdminUser | TeamInfo, colKey: string) {
    const isTeam = 'teamId' in item;
    const name = isTeam ? item.teamName : item.userId;

    if (colKey === NAME_COLUMN.key) {
      return (
        <div className="tw:flex tw:items-center tw:gap-2">
          <StaticImage className="tw:w-4" icon={isTeam ? '/icons/team.svg' : '/icons/user.svg'} />
          <span className="tw:truncate" title={name}>
            {name ?? ''}
          </span>
        </div>
      );
    }

    if (colKey === DESCRIPTION_COLUMN.key) {
      const description = isTeam ? item.description : '';
      return (
        <span className="tw:truncate" title={description}>
          {description}
        </span>
      );
    }

    return null;
  }

  function isVisible(item: AdminUser | TeamInfo, filter: string) {
    const isTeam = 'teamId' in item;
    const name = isTeam ? item.teamName : item.userId;
    const match = !!name?.toLowerCase().includes(filter.toLowerCase());

    if (isTeam) {
      return item.teamId !== 'admin' && match;
    }

    return item.enabled && match;
  }

  return (
    <div className="tw:flex tw:flex-col tw:gap-4 tw:overflow-auto tw:p-4">
      <GrantManagementTable
        items={items}
        columns={COLUMNS}
        getItemId={item => ('teamId' in item ? item.teamId : item.userId)}
        isGranted={isGranted}
        isEdited={isEdited}
        getCell={getCell}
        isVisible={isVisible}
        disabled={formState.isDisabled}
        onGrant={accessPart.grant}
        onRevoke={accessPart.revoke}
      />
    </div>
  );
});
