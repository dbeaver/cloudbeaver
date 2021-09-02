/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { computed } from 'mobx';
import { observer } from 'mobx-react-lite';
import { useMemo } from 'react';
import styled, { css } from 'reshadow';

import { UsersResource } from '@cloudbeaver/core-authentication';
import {
  BASE_CONTAINERS_STYLES, ColoredContainer, Container, Group,
  IconOrImage, Loader, TabContainerPanelComponent,
  TextPlaceholder, useMapResource, useTab,
} from '@cloudbeaver/core-blocks';
import { TLocalizationToken, useTranslate } from '@cloudbeaver/core-localization';
import { useStyles } from '@cloudbeaver/core-theming';

import type { IRoleFormProps } from '../IRoleFormProps';
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
  info-item {
    display: flex;
    align-items: center;
    flex: 0 0 auto;
  }
  IconOrImage {
    width: 24px;
    height: 24px;
    margin-right: 16px;
  }
  Loader {
    z-index: 2;
  }
`;

interface IInfoItem {
  text: TLocalizationToken;
  icon: string;
}

export const GrantedUsers: TabContainerPanelComponent<IRoleFormProps> = observer(function GrantedUsers({
  tabId,
  state: formState,
}) {
  const style = useStyles(BASE_CONTAINERS_STYLES, styles);
  const translate = useTranslate();

  const { state, edit, grant, load, revoke } = useGrantedUsers(formState.config, formState.mode);

  const users = useMapResource(UsersResource, UsersResource.keyAll);

  const grantedUsers = useMemo(() => computed(() => users.resource.values
    .filter(user => state.grantedUsers.includes(user.userId))
  ), [state.grantedUsers, users.resource]);

  const { selected } = useTab(tabId, load);

  if (!selected) {
    return null;
  }

  let infoItem: IInfoItem | null = null;

  const unsaved = (formState.mode === 'edit' && (state.initialGrantedUsers.length !== state.grantedUsers.length
    || state.initialGrantedUsers.some(subject => !state.grantedUsers.includes(subject))));

  if (unsaved) {
    infoItem = {
      text: 'connections_connection_access_save_reminder',
      icon: '/icons/info_icon.svg',
    };
  }

  return styled(style)(
    <Loader state={[users, state]}>
      {() => styled(style)(
        <ColoredContainer parent gap vertical>
          {!users.resource.values.length ? (
            <Group keepSize large>
              <TextPlaceholder>{translate('administration_roles_role_granted_users_empty')}</TextPlaceholder>
            </Group>
          ) : (
            <>
              {infoItem && (
                <info-item>
                  <IconOrImage icon={infoItem.icon} />
                  {translate(infoItem.text)}
                </info-item>
              )}
              <Container gap overflow>
                <GrantedUserList
                  grantedUsers={grantedUsers.get()}
                  disabled={formState.disabled}
                  onEdit={edit}
                  onRevoke={revoke}
                />
                {state.editing && (
                  <UserList
                    userList={users.resource.values}
                    grantedUsers={state.grantedUsers}
                    disabled={formState.disabled}
                    onGrant={grant}
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
