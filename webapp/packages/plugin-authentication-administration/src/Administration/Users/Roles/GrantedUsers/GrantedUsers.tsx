/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { computed } from 'mobx';
import { observer } from 'mobx-react-lite';
import { useEffect, useMemo } from 'react';
import styled, { css } from 'reshadow';

import { UsersResource } from '@cloudbeaver/core-authentication';
import { TabContainerPanelComponent, useTab } from '@cloudbeaver/core-ui';
import {
  BASE_CONTAINERS_STYLES, ColoredContainer, Container, Group,
  InfoItem, Loader, TextPlaceholder, useMapResource
} from '@cloudbeaver/core-blocks';
import { useTranslate } from '@cloudbeaver/core-localization';
import { CachedMapAllKey } from '@cloudbeaver/core-sdk';
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
  Loader {
    z-index: 2;
  }
`;

export const GrantedUsers: TabContainerPanelComponent<IRoleFormProps> = observer(function GrantedUsers({
  tabId,
  state: formState,
}) {
  const style = useStyles(BASE_CONTAINERS_STYLES, styles);
  const translate = useTranslate();

  const state = useGrantedUsers(formState.config, formState.mode);
  const { selected } = useTab(tabId);

  const users = useMapResource(GrantedUsers, UsersResource, selected ? CachedMapAllKey : null);

  const grantedUsers = useMemo(() => computed(() => users.resource.values
    .filter(user => state.state.grantedUsers.includes(user.userId))
  ), [state.state.grantedUsers, users.resource]);

  useEffect(() => {
    if (selected && !state.state.loaded) {
      state.load();
    }
  }, [selected, state.state.loaded]);

  if (!selected) {
    return null;
  }

  return styled(style)(
    <Loader state={[users, state.state]}>
      {() => styled(style)(
        <ColoredContainer parent gap vertical>
          {!users.resource.values.length ? (
            <Group keepSize large>
              <TextPlaceholder>{translate('administration_roles_role_granted_users_empty')}</TextPlaceholder>
            </Group>
          ) : (
            <>
              {formState.mode === 'edit' && state.changed && <InfoItem info='ui_save_reminder' />}
              <Container gap overflow>
                <GrantedUserList
                  grantedUsers={grantedUsers.get()}
                  disabled={formState.disabled}
                  onEdit={state.edit}
                  onRevoke={state.revoke}
                />
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
