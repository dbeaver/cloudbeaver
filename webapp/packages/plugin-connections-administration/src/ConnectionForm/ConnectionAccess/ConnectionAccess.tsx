/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { computed } from 'mobx';
import { observer } from 'mobx-react-lite';
import { useMemo } from 'react';
import styled, { css } from 'reshadow';

import { RolesResource, UsersResource } from '@cloudbeaver/core-authentication';
import {
  TextPlaceholder,
  Loader,
  useMapResource,
  BASE_CONTAINERS_STYLES,
  ColoredContainer,
  Group,
  Container,
  InfoItem,
} from '@cloudbeaver/core-blocks';
import { isCloudConnection } from '@cloudbeaver/core-connections';
import { TLocalizationToken, useTranslate } from '@cloudbeaver/core-localization';
import { CachedMapAllKey } from '@cloudbeaver/core-sdk';
import { useStyles } from '@cloudbeaver/core-theming';
import { TabContainerPanelComponent, useTab } from '@cloudbeaver/core-ui';
import type { IConnectionFormProps } from '@cloudbeaver/plugin-connections';

import { ConnectionAccessGrantedList } from './ConnectionAccessGrantedList';
import { ConnectionAccessList } from './ConnectionAccessList';
import { useConnectionAccessState } from './useConnectionAccessState';


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

export const ConnectionAccess: TabContainerPanelComponent<IConnectionFormProps> = observer(function ConnectionAccess({
  tabId,
  state: formState,
}) {
  const state = useConnectionAccessState(formState.info);
  const style = useStyles(styles, BASE_CONTAINERS_STYLES);
  const translate = useTranslate();

  const { selected } = useTab(tabId, state.load);

  const users = useMapResource(ConnectionAccess, UsersResource, CachedMapAllKey);
  const roles = useMapResource(ConnectionAccess, RolesResource, CachedMapAllKey);

  const grantedUsers = useMemo(() => computed(() => users.resource.values
    .filter(user => state.state.grantedSubjects.includes(user.userId))
  ), [state.state.grantedSubjects, users.resource]);

  const grantedRoles = useMemo(() => computed(() => roles.resource.values
    .filter(role => state.state.grantedSubjects.includes(role.roleId))
  ), [state.state.grantedSubjects, roles.resource]);

  if (!selected) {
    return null;
  }

  const loading = users.isLoading() || roles.isLoading() || state.state.loading;
  const cloud = formState.info ? isCloudConnection(formState.info) : false;
  const disabled = loading || !state.state.loaded || formState.disabled || cloud;
  let info: TLocalizationToken | null = null;

  if (formState.mode === 'edit' && state.changed) {
    info = 'ui_save_reminder';
  } else if (cloud) {
    info = 'cloud_connections_access_placeholder';
  }

  return styled(style)(
    <Loader state={[users, roles, state.state]}>
      {() => styled(style)(
        <ColoredContainer parent gap vertical>
          {!users.resource.values.length && !roles.resource.values.length ? (
            <Group keepSize large>
              <TextPlaceholder>{translate('connections_administration_connection_access_empty')}</TextPlaceholder>
            </Group>
          ) : (
            <>
              {info && <InfoItem info={info} />}
              <Container gap overflow>
                <ConnectionAccessGrantedList
                  grantedUsers={grantedUsers.get()}
                  grantedRoles={grantedRoles.get()}
                  disabled={disabled}
                  onEdit={state.edit}
                  onRevoke={state.revoke}
                />
                {state.state.editing && (
                  <ConnectionAccessList
                    userList={users.resource.values}
                    roleList={roles.resource.values}
                    grantedSubjects={state.state.grantedSubjects}
                    disabled={disabled}
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
