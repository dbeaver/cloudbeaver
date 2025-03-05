/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { computed } from 'mobx';
import { observer } from 'mobx-react-lite';
import { useMemo } from 'react';

import { TeamsResource, UsersResource, UsersResourceFilterKey } from '@cloudbeaver/core-authentication';
import {
  ColoredContainer,
  Container,
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
import { ConnectionInfoOriginResource, ConnectionInfoResource, createConnectionParam, isCloudConnection } from '@cloudbeaver/core-connections';
import type { TLocalizationToken } from '@cloudbeaver/core-localization';
import { CachedMapAllKey, CachedResourceOffsetPageListKey } from '@cloudbeaver/core-resource';
import { type TabContainerPanelComponent, useTab } from '@cloudbeaver/core-ui';
import type { IConnectionFormPropsRefactored } from '@cloudbeaver/plugin-connections';

import styles from './ConnectionAccess.module.css';
import { ConnectionAccessGrantedList } from './ConnectionAccessGrantedList.js';
import { ConnectionAccessList } from './ConnectionAccessList.js';
import { useService } from '@cloudbeaver/core-di';
import { getConnectionFormAccessPart } from './getConnectionFormAccessPart.js';

export const ConnectionAccess: TabContainerPanelComponent<IConnectionFormPropsRefactored> = observer(function ConnectionAccess({ tabId, formState }) {
  const translate = useTranslate();
  const style = useS(styles);

  const { selected } = useTab(tabId);
  const accessPart = getConnectionFormAccessPart(formState);

  useAutoLoad(ConnectionAccess, accessPart, selected);

  const users = useResource(ConnectionAccess, UsersResource, CachedResourceOffsetPageListKey(0, 1000).setParent(UsersResourceFilterKey()), {
    active: selected,
  });
  const teams = useResource(ConnectionAccess, TeamsResource, CachedMapAllKey, { active: selected });

  const grantedUsers = useMemo(
    () => computed(() => users.resource.values.filter(user => accessPart.state.grantedSubjects.includes(user.userId))),
    [accessPart.state.grantedSubjects, users.resource],
  );

  const grantedTeams = useMemo(
    () => computed(() => teams.resource.values.filter(team => accessPart.state.grantedSubjects.includes(team.teamId))),
    [accessPart.state.grantedSubjects, teams.resource],
  );

  if (!selected) {
    return null;
  }

  const connectionInfoService = useService(ConnectionInfoResource);
  const originInfoService = useService(ConnectionInfoOriginResource);
  const connectionInfo = connectionInfoService.get(createConnectionParam(formState.state.projectId, formState.state.config.connectionId!));
  const originInfo = originInfoService.get(createConnectionParam(formState.state.projectId, formState.state.config.connectionId!));
  const loading = users.isLoading() || teams.isLoading() || accessPart.isLoading();
  const cloud = connectionInfo && originInfo?.origin ? isCloudConnection(originInfo.origin) : false;
  const disabled = loading || !accessPart.isLoaded() || formState.isDisabled || cloud;
  let info: TLocalizationToken | null = null;

  if (formState.mode === 'edit' && formState.isChanged) {
    info = 'ui_save_reminder';
  } else if (cloud) {
    info = 'cloud_connections_access_placeholder';
  }

  return (
    <Loader className={s(style, { loader: true })} state={[users, teams, accessPart]}>
      {() => (
        <ColoredContainer className={s(style, { coloredContainer: true })} parent gap vertical>
          {!users.resource.values.length && !teams.resource.values.length ? (
            <Group className={s(style, { group: true })} keepSize large>
              <TextPlaceholder>{translate('connections_administration_connection_access_empty')}</TextPlaceholder>
            </Group>
          ) : (
            <>
              {info && <InfoItem info={info} />}
              <Container gap overflow>
                <ConnectionAccessGrantedList
                  grantedUsers={grantedUsers.get()}
                  grantedTeams={grantedTeams.get()}
                  disabled={disabled}
                  onEdit={accessPart.edit}
                  onRevoke={accessPart.revoke}
                />
                {accessPart.state.editing && (
                  <ConnectionAccessList
                    userList={users.resource.values}
                    teamList={teams.resource.values}
                    grantedSubjects={accessPart.state.grantedSubjects}
                    disabled={disabled}
                    onGrant={accessPart.grant}
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
