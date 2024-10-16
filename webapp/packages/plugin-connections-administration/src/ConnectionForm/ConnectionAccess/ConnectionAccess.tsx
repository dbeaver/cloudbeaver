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
import { isCloudConnection } from '@cloudbeaver/core-connections';
import type { TLocalizationToken } from '@cloudbeaver/core-localization';
import { CachedMapAllKey, CachedResourceOffsetPageListKey } from '@cloudbeaver/core-resource';
import { type TabContainerPanelComponent, useTab } from '@cloudbeaver/core-ui';
import type { IConnectionFormProps } from '@cloudbeaver/plugin-connections';

import styles from './ConnectionAccess.module.css';
import { ConnectionAccessGrantedList } from './ConnectionAccessGrantedList.js';
import { ConnectionAccessList } from './ConnectionAccessList.js';
import { useConnectionAccessState } from './useConnectionAccessState.js';

export const ConnectionAccess: TabContainerPanelComponent<IConnectionFormProps> = observer(function ConnectionAccess({ tabId, state: formState }) {
  const state = useConnectionAccessState(formState.info);
  const translate = useTranslate();
  const style = useS(styles);

  const { selected } = useTab(tabId);

  useAutoLoad(ConnectionAccess, state, selected);

  const users = useResource(ConnectionAccess, UsersResource, CachedResourceOffsetPageListKey(0, 1000).setParent(UsersResourceFilterKey()), {
    active: selected,
  });
  const teams = useResource(ConnectionAccess, TeamsResource, CachedMapAllKey, { active: selected });

  const grantedUsers = useMemo(
    () => computed(() => users.resource.values.filter(user => state.state.grantedSubjects.includes(user.userId))),
    [state.state.grantedSubjects, users.resource],
  );

  const grantedTeams = useMemo(
    () => computed(() => teams.resource.values.filter(team => state.state.grantedSubjects.includes(team.teamId))),
    [state.state.grantedSubjects, teams.resource],
  );

  if (!selected) {
    return null;
  }

  const loading = users.isLoading() || teams.isLoading() || state.state.loading;
  const cloud = formState.info && formState.originInfo?.origin ? isCloudConnection(formState.originInfo.origin) : false;
  const disabled = loading || !state.state.loaded || formState.disabled || cloud;
  let info: TLocalizationToken | null = null;

  if (formState.mode === 'edit' && state.changed) {
    info = 'ui_save_reminder';
  } else if (cloud) {
    info = 'cloud_connections_access_placeholder';
  }

  return (
    <Loader className={s(style, { loader: true })} state={[users, teams, state.state]}>
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
                  onEdit={state.edit}
                  onRevoke={state.revoke}
                />
                {state.state.editing && (
                  <ConnectionAccessList
                    userList={users.resource.values}
                    teamList={teams.resource.values}
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
