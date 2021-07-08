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

import { RolesResource, UsersResource } from '@cloudbeaver/core-authentication';
import {
  TextPlaceholder,
  Loader,
  useTab,
  TabContainerPanelComponent,
  useMapResource,
  BASE_CONTAINERS_STYLES,
  ColoredContainer,
  Group,
  IconOrImage,
  Container,
} from '@cloudbeaver/core-blocks';
import { TLocalizationToken, useTranslate } from '@cloudbeaver/core-localization';
import { useStyles } from '@cloudbeaver/core-theming';

import { isCloudConnection } from '../../Administration/ConnectionsResource';
import type { IConnectionFormProps } from '../IConnectionFormProps';
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

export const ConnectionAccess: TabContainerPanelComponent<IConnectionFormProps> = observer(function ConnectionAccess({
  tabId,
  state: formState,
}) {
  const { state, edit, grant, revoke, load } = useConnectionAccessState(formState.info);
  const style = useStyles(styles, BASE_CONTAINERS_STYLES);
  const translate = useTranslate();
  const unsaved = state.initialGrantedSubjects.length !== state.grantedSubjects.length
   || state.initialGrantedSubjects.some(subject => !state.grantedSubjects.includes(subject));

  const users = useMapResource(UsersResource, null, {
    onLoad: resource => resource.loadAll(),
  });

  const roles = useMapResource(RolesResource, null, {
    onLoad: resource => resource.loadAll(),
  });

  const grantedUsers = useMemo(() => computed(() => users.resource.values
    .filter(user => state.grantedSubjects.includes(user.userId))
  ), [state.grantedSubjects, users.resource]);

  const grantedRoles = useMemo(() => computed(() => roles.resource.values
    .filter(role => state.grantedSubjects.includes(role.roleId))
  ), [state.grantedSubjects, roles.resource]);

  const { selected } = useTab(tabId, load);
  const loading = users.isLoading() || roles.isLoading() || state.loading;
  const cloud = formState.info ? isCloudConnection(formState.info) : false;
  const disabled = loading || !state.loaded || formState.disabled || cloud;
  let infoItem: IInfoItem | null = null;

  if (unsaved) {
    infoItem = {
      text: 'connections_connection_access_save_reminder',
      icon: '/icons/info_icon.svg',
    };
  }

  if (cloud) {
    infoItem = {
      text: 'connections_connection_access_cloud_placeholder',
      icon: '/icons/info_icon.svg',
    };
  }

  if (!selected) {
    return null;
  }

  return styled(style)(
    <Loader state={[users, roles, state]}>
      {() => styled(style)(
        <ColoredContainer parent gap vertical>
          {!users.resource.values.length && !roles.resource.values.length ? (
            <Group keepSize large>
              <TextPlaceholder>{translate('connections_administration_connection_access_empty')}</TextPlaceholder>
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
                <ConnectionAccessGrantedList
                  grantedUsers={grantedUsers.get()}
                  grantedRoles={grantedRoles.get()}
                  disabled={disabled}
                  onEdit={edit}
                  onRevoke={revoke}
                />
                {state.editing && (
                  <ConnectionAccessList
                    userList={users.resource.values}
                    roleList={roles.resource.values}
                    grantedSubjects={state.grantedSubjects}
                    disabled={disabled}
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
