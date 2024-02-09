/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { AdminUser, UsersResource, UsersResourceFilterKey } from '@cloudbeaver/core-authentication';
import {
  ColoredContainer,
  Container,
  getComputed,
  Group,
  InfoItem,
  Loader,
  s,
  TextPlaceholder,
  useAutoLoad,
  useResource,
  useS,
  useTranslate,
} from '@cloudbeaver/core-blocks';
import { CachedResourceOffsetPageListKey } from '@cloudbeaver/core-resource';
import { ServerConfigResource } from '@cloudbeaver/core-root';
import { TabContainerPanelComponent, useTab } from '@cloudbeaver/core-ui';

import type { ITeamFormProps } from '../ITeamFormProps';
import { GrantedUserList } from './GrantedUserList';
import style from './GrantedUsers.m.css';
import { useGrantedUsers } from './useGrantedUsers';
import { UserList } from './UserList';

export const GrantedUsers: TabContainerPanelComponent<ITeamFormProps> = observer(function GrantedUsers({ tabId, state: formState }) {
  const styles = useS(style);
  const translate = useTranslate();

  const state = useGrantedUsers(formState.config, formState.mode);
  const { selected } = useTab(tabId);

  const serverConfigResource = useResource(UserList, ServerConfigResource, undefined, { active: selected });
  const isDefaultTeam = formState.config.teamId === serverConfigResource.data?.defaultUserTeam;

  const users = useResource(GrantedUsers, UsersResource, CachedResourceOffsetPageListKey(0, 1000).setTarget(UsersResourceFilterKey()), {
    active: selected && !isDefaultTeam,
  });

  const grantedUsers = getComputed(() =>
    users.data.filter<AdminUser>((user): user is AdminUser => !!user && state.state.grantedUsers.includes(user.userId)),
  );

  useAutoLoad(GrantedUsers, state, selected && !state.state.loaded && !isDefaultTeam);

  if (!selected) {
    return null;
  }

  if (isDefaultTeam) {
    return (
      <ColoredContainer className={s(styles, { box: true })} parent gap vertical>
        <Group className={s(styles, { placeholderBox: true })} keepSize large>
          <TextPlaceholder>{translate('plugin_authentication_administration_team_default_users_tooltip')}</TextPlaceholder>
        </Group>
      </ColoredContainer>
    );
  }

  return (
    <Loader className={s(styles, { loader: true })} state={[state.state]}>
      {() => (
        <ColoredContainer className={s(styles, { box: true })} parent gap vertical>
          {!users.resource.values.length ? (
            <Group className={s(styles, { placeholderBox: true })} keepSize large>
              <TextPlaceholder>{translate('administration_teams_team_granted_users_empty')}</TextPlaceholder>
            </Group>
          ) : (
            <>
              {formState.mode === 'edit' && state.changed && <InfoItem info="ui_save_reminder" />}
              <Container gap overflow>
                <GrantedUserList grantedUsers={grantedUsers} disabled={formState.disabled} onEdit={state.edit} onRevoke={state.revoke} />
                {state.state.editing && (
                  <UserList
                    userList={users.resource.values}
                    grantedUsers={state.state.grantedUsers}
                    disabled={formState.disabled}
                    onGrant={state.grant}
                  />
                )}
              </Container>
            </>
          )}
        </ColoredContainer>
      )}
    </Loader>
  );
});
