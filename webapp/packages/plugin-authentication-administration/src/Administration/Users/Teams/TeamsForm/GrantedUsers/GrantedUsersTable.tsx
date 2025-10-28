/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
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
  compareUsers,
  TeamRolesResource,
  USER_TEAM_ROLE_SUPERVISOR,
  UsersResource,
  UsersResourceFilterKey,
  type AdminUser,
} from '@cloudbeaver/core-authentication';

import type { TeamFormProps } from '../TeamsAdministrationFormService.js';
import type { GrantedUsersFormPart } from './GrantedUsersFormPart.js';

const USER_ID_COLUMN: IGrantManagementTableColumn = { key: 'userId', label: 'administration_teams_team_granted_users_user_id' };
const TEAM_ROLE_COLUMN: IGrantManagementTableColumn = {
  key: 'teamRole',
  label: 'plugin_authentication_administration_team_user_team_role_supervisor',
};

const COLUMNS: IGrantManagementTableColumn[] = [USER_ID_COLUMN];

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

  const columns = [...COLUMNS];

  if (teamRolesResource.data.length > 0) {
    columns.push(TEAM_ROLE_COLUMN);
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

    if (colKey === TEAM_ROLE_COLUMN.key) {
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

  const items = (usersLoader.data.filter(user => user?.enabled) as AdminUser[]).sort(compareUsers);

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
