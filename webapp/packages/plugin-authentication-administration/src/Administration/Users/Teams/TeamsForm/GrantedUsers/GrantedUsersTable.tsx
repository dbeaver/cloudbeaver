/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';

import { useTab, useTabState, type TabContainerPanelComponent } from '@cloudbeaver/core-ui';
import { Alert, Checkbox, StaticImage, useAutoLoad, useResource, useTranslate } from '@cloudbeaver/core-blocks';
import { CachedResourceOffsetPageListKey } from '@cloudbeaver/core-resource';
import { GrantManagementTable, type IGrantManagementTableColumn } from '@cloudbeaver/plugin-data-grid';
import { ServerConfigResource } from '@cloudbeaver/core-root';
import {
  compareUsersById,
  compareUsersByLastLogin,
  TeamRolesResource,
  USER_TEAM_ROLE_SUPERVISOR,
  UsersResource,
  UsersResourceFilterKey,
  type AdminUser,
} from '@cloudbeaver/core-authentication';

import type { TeamFormProps } from '../TeamsAdministrationFormService.js';
import type { GrantedUsersFormPart } from './GrantedUsersFormPart.js';
import { useMemo } from 'react';

const USER_ID_COLUMN: IGrantManagementTableColumn<AdminUser> = {
  key: 'userId',
  label: 'administration_teams_team_granted_users_user_id',
  compare: compareUsersById,
};
const LAST_LOGIN_COLUMN: IGrantManagementTableColumn<AdminUser> = {
  key: 'lastLogin',
  label: 'plugin_authentication_administration_user_last_login',
  compare: compareUsersByLastLogin,
};
const TEAM_ROLE_COLUMN_KEY = 'teamRole';

const COLUMNS: IGrantManagementTableColumn<AdminUser>[] = [USER_ID_COLUMN, LAST_LOGIN_COLUMN];

export const GrantedUsersTable: TabContainerPanelComponent<TeamFormProps> = observer(function GrantedUsersTable({ tabId, formState }) {
  const translate = useTranslate();
  const tabState = useTabState<GrantedUsersFormPart>();

  const { selected } = useTab(tabId);

  const serverConfigResource = useResource(GrantedUsersTable, ServerConfigResource, undefined, { active: selected });
  const isDefaultTeam = formState.state.teamId === serverConfigResource.data?.defaultUserTeam;

  const active = selected && !isDefaultTeam;
  const teamRolesResource = useResource(GrantedUsersTable, TeamRolesResource, undefined, { active });
  const usersLoader = useResource(GrantedUsersTable, UsersResource, CachedResourceOffsetPageListKey(0, 1000).setParent(UsersResourceFilterKey()), {
    active,
  });
  const grantedUsersIdsMap = useMemo(() => new Map(tabState.state.grantedUsers.map(user => [user.userId, user])), [tabState.state.grantedUsers]);

  useAutoLoad(GrantedUsersTable, tabState, active);

  if (!selected) {
    return null;
  }

  if (isDefaultTeam) {
    return <Alert className="tw:h-max">{translate('plugin_authentication_administration_team_default_users_tooltip')}</Alert>;
  }

  function isGranted(user: AdminUser) {
    return tabState.state.grantedUsers.some(u => u.userId === user.userId);
  }

  function isEdited(user: AdminUser) {
    const initial = tabState.initialState.grantedUsers.find(grantedUser => grantedUser.userId === user.userId);
    const current = tabState.state.grantedUsers.find(grantedUser => grantedUser.userId === user.userId);

    return !initial !== !current || initial?.teamRole !== current?.teamRole;
  }

  function isManageable(user: AdminUser) {
    if (serverConfigResource.data?.distributed) {
      return true;
    }

    return !usersLoader.resource.isActiveUser(user.userId);
  }

  function getTeamRoleRank(user: AdminUser) {
    const granted = grantedUsersIdsMap.get(user.userId);

    if (!granted) {
      return 0;
    }

    return granted.teamRole === USER_TEAM_ROLE_SUPERVISOR ? 2 : 1;
  }

  const columns = [...COLUMNS];

  if (teamRolesResource.data.length > 0) {
    columns.push({
      key: TEAM_ROLE_COLUMN_KEY,
      label: 'plugin_authentication_administration_team_user_team_role_supervisor',
      compare: (a, b) => getTeamRoleRank(a) - getTeamRoleRank(b),
    });
  }

  function getCell(user: AdminUser, colKey: string) {
    if (colKey === USER_ID_COLUMN.key) {
      const isMe = usersLoader.resource.isActiveUser(user.userId);

      let name = user.userId;
      let title = user.userId;

      if (isMe) {
        name += ` (${translate('ui_you')})`;
      }

      if (!isManageable(user)) {
        title += ` - ${translate('administration_teams_team_granted_users_permission_denied')}`;
      }

      return (
        <div title={title} className="tw:font-medium tw:flex tw:items-center tw:gap-2">
          <StaticImage className="tw:w-4" icon="/icons/user.svg" />
          <span className="tw:truncate">{name}</span>
        </div>
      );
    }

    if (colKey === LAST_LOGIN_COLUMN.key) {
      const lastLoginFullTime = user.lastLoginTime ? new Date(user.lastLoginTime).toLocaleString() : '-';
      const lastLoginDate = user.lastLoginTime ? new Date(user.lastLoginTime).toLocaleDateString() : '-';

      return <span title={lastLoginFullTime}>{lastLoginDate}</span>;
    }

    if (colKey === TEAM_ROLE_COLUMN_KEY) {
      const granted = tabState.state.grantedUsers.find(grantedUser => grantedUser.userId === user.userId);

      if (granted) {
        return (
          <Checkbox
            className="tw:flex tw:justify-center"
            title={translate('plugin_authentication_administration_team_user_team_role_supervisor_description')}
            checked={granted?.teamRole === USER_TEAM_ROLE_SUPERVISOR}
            onChange={value => tabState.assignTeamRole(user.userId, value ? USER_TEAM_ROLE_SUPERVISOR : null)}
          />
        );
      }

      return <span className="tw:flex tw:justify-center">-</span>;
    }

    return null;
  }

  const items = (usersLoader.data.filter(user => user?.enabled) as AdminUser[]).sort(compareUsersById);

  return (
    <GrantManagementTable
      items={items}
      columns={columns}
      getItemId={item => item.userId}
      isGranted={isGranted}
      isEdited={isEdited}
      isVisible={(user, filter) => user.userId.toLowerCase().includes(filter.toLowerCase())}
      isManageable={isManageable}
      getCell={getCell}
      disabled={formState.isDisabled}
      onGrant={tabState.grant}
      onRevoke={tabState.revoke}
    />
  );
});
