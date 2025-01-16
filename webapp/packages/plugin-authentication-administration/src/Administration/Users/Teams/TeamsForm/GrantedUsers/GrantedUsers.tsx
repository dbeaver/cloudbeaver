/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { UsersResource, UsersResourceFilterKey } from '@cloudbeaver/core-authentication';
import { Container, Group, InfoItem, Loader, s, TextPlaceholder, useAutoLoad, useResource, useS, useTranslate } from '@cloudbeaver/core-blocks';
import { CachedResourceOffsetPageListKey } from '@cloudbeaver/core-resource';
import { ServerConfigResource } from '@cloudbeaver/core-root';
import { type TabContainerPanelComponent, useTab } from '@cloudbeaver/core-ui';

import type { ITeamFormProps } from '../ITeamFormProps.js';
import { GrantedUserList } from './GrantedUserList.js';
import style from './GrantedUsers.module.css';
import type { IGrantedUser } from './IGrantedUser.js';
import { useGrantedUsers } from './useGrantedUsers.js';
import { UserList } from './UserList.js';

export const GrantedUsers: TabContainerPanelComponent<ITeamFormProps> = observer(function GrantedUsers({ tabId, state: formState }) {
  const styles = useS(style);
  const translate = useTranslate();

  const state = useGrantedUsers(formState.config, formState.mode);
  const { selected } = useTab(tabId);

  const serverConfigResource = useResource(UserList, ServerConfigResource, undefined, { active: selected });
  const isDefaultTeam = formState.config.teamId === serverConfigResource.data?.defaultUserTeam;

  const users = useResource(GrantedUsers, UsersResource, CachedResourceOffsetPageListKey(0, 1000).setParent(UsersResourceFilterKey()), {
    active: selected && !isDefaultTeam,
  });

  const grantedUsers: IGrantedUser[] = [];

  for (const user of users.data) {
    const granted = state.state.grantedUsers.find(grantedUser => grantedUser.userId === user?.userId);

    if (granted && user) {
      grantedUsers.push({
        ...user,
        teamRole: granted.teamRole,
      });
    }
  }

  useAutoLoad(GrantedUsers, state, selected && !state.state.loaded && !isDefaultTeam);

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
    <Loader className={s(styles, { loader: true })} state={[state.state]}>
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
              {formState.mode === 'edit' && state.changed && <InfoItem info="ui_save_reminder" />}
              <Container gap overflow>
                <GrantedUserList
                  grantedUsers={grantedUsers}
                  disabled={formState.disabled}
                  onEdit={state.edit}
                  onRevoke={state.revoke}
                  onTeamRoleAssign={state.assignTeamRole}
                />
                {state.state.editing && (
                  <UserList
                    userList={users.resource.values}
                    grantedUsers={grantedUsers.map(user => user.userId)}
                    disabled={formState.disabled}
                    onGrant={state.grant}
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
