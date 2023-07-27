/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import styled, { css } from 'reshadow';

import { AdminUser, UsersResource, UsersResourceSearchUser } from '@cloudbeaver/core-authentication';
import {
  ColoredContainer,
  Container,
  getComputed,
  Group,
  InfoItem,
  Loader,
  TextPlaceholder,
  useAutoLoad,
  useResource,
  useStyles,
  useTranslate,
} from '@cloudbeaver/core-blocks';
import { TabContainerPanelComponent, useTab } from '@cloudbeaver/core-ui';

import type { ITeamFormProps } from '../ITeamFormProps';
import { GrantedUserList } from './GrantedUserList';
import { useGrantedUsers } from './useGrantedUsers';
import { UserList } from './UserList';

const styles = css`
  ColoredContainer {
    flex: 1;
    height: 100%;
    box-sizing: border-box;
  }
  Group {
    max-height: 100%;
    position: relative;
    overflow: auto !important;
  }
  Loader {
    z-index: 2;
  }
`;

export const GrantedUsers: TabContainerPanelComponent<ITeamFormProps> = observer(function GrantedUsers({ tabId, state: formState }) {
  const style = useStyles(styles);
  const translate = useTranslate();

  const state = useGrantedUsers(formState.config, formState.mode);
  const { selected } = useTab(tabId);

  const users = useResource(GrantedUsers, UsersResource, UsersResourceSearchUser(0, 1000), { active: selected });

  const grantedUsers = getComputed(() =>
    users.data.filter<AdminUser>((user): user is AdminUser => !!user && state.state.grantedUsers.includes(user.userId)),
  );

  useAutoLoad(state, selected && !state.state.loaded);

  if (!selected) {
    return null;
  }

  return styled(style)(
    <Loader state={[state.state]}>
      {() =>
        styled(style)(
          <ColoredContainer parent gap vertical>
            {!users.resource.values.length ? (
              <Group keepSize large>
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
          </ColoredContainer>,
        )
      }
    </Loader>,
  );
});
