/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useState } from 'react';

import { UsersResource, UsersResourceFilterKey } from '@cloudbeaver/core-authentication';
import { Container, Group, InfoItem, Loader, s, TextPlaceholder, useAutoLoad, useResource, useS, useTranslate } from '@cloudbeaver/core-blocks';
import { CachedResourceOffsetPageListKey } from '@cloudbeaver/core-resource';
import { ServerConfigResource } from '@cloudbeaver/core-root';
import { type TabContainerPanelComponent, useTab } from '@cloudbeaver/core-ui';

import type { TeamFormProps } from '../TeamsAdministrationFormService.js';
import { getGrantedUsersFormPart } from './getGrantedUsersFormPart.js';
import { GrantedUserList } from './GrantedUserList.js';
import style from './GrantedUsers.module.css';
import type { IGrantedUser } from './IGrantedUser.js';
import { UserList } from './UserList.js';

export const GrantedUsers: TabContainerPanelComponent<TeamFormProps> = observer(function GrantedUsers({ tabId, formState }) {
  const styles = useS(style);
  const translate = useTranslate();
  const [edit, setEdit] = useState(false);

  const part = getGrantedUsersFormPart(formState);
  const { selected } = useTab(tabId);

  const serverConfigResource = useResource(UserList, ServerConfigResource, undefined, { active: selected });
  const isDefaultTeam = formState.state.teamId === serverConfigResource.data?.defaultUserTeam;

  const users = useResource(GrantedUsers, UsersResource, CachedResourceOffsetPageListKey(0, 1000).setParent(UsersResourceFilterKey()), {
    active: selected && !isDefaultTeam,
  });

  const grantedUsers: IGrantedUser[] = [];

  for (const user of users.data) {
    const granted = part.state.grantedUsers.find(grantedUser => grantedUser.userId === user?.userId);

    if (granted && user) {
      grantedUsers.push({
        ...user,
        teamRole: granted.teamRole,
      });
    }
  }

  function toggleEdit() {
    setEdit(value => !value);
  }

  useAutoLoad(GrantedUsers, part, selected && !part.isLoaded() && !isDefaultTeam);

  if (!selected) {
    return null;
  }

  if (isDefaultTeam) {
    return (
      <Container>
        <Group large>
          <TextPlaceholder className={s(styles, { placeholder: true })}>
            {translate('plugin_authentication_administration_team_default_users_tooltip')}
          </TextPlaceholder>
        </Group>
      </Container>
    );
  }

  return (
    <Loader className={s(styles, { loader: true })} state={part}>
      {() => (
        <Container className={s(styles, { box: true })} parent={!!users.resource.values.length} gap vertical>
          {!users.resource.values.length ? (
            <Group large>
              <TextPlaceholder className={s(styles, { placeholder: true })}>
                {translate('administration_teams_team_granted_users_empty')}
              </TextPlaceholder>
            </Group>
          ) : (
            <>
              {formState.mode === 'edit' && part.isChanged && <InfoItem info="ui_save_reminder" />}
              <Container gap overflow>
                <GrantedUserList
                  grantedUsers={grantedUsers}
                  disabled={formState.isDisabled}
                  onEdit={toggleEdit}
                  onRevoke={part.revoke}
                  onTeamRoleAssign={part.assignTeamRole}
                />
                {edit && (
                  <UserList
                    userList={users.resource.values}
                    grantedUsers={grantedUsers.map(user => user.userId)}
                    disabled={formState.isDisabled}
                    onGrant={part.grant}
                  />
                )}
              </Container>
            </>
          )}
        </Container>
      )}
    </Loader>
  );
});
