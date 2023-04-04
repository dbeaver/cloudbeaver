/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { computed } from 'mobx';
import { observer } from 'mobx-react-lite';
import { useMemo } from 'react';
import styled, { css } from 'reshadow';

import { TeamsResource, UsersResource } from '@cloudbeaver/core-authentication';
import {
  TextPlaceholder,
  Loader,
  useResource,
  BASE_CONTAINERS_STYLES,
  ColoredContainer,
  Group,
  Container,
  InfoItem,
  useAutoLoad,
  useTranslate,
} from '@cloudbeaver/core-blocks';
import { isCloudConnection } from '@cloudbeaver/core-connections';
import type { TLocalizationToken } from '@cloudbeaver/core-localization';
import { CachedMapAllKey } from '@cloudbeaver/core-sdk';
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
  const translate = useTranslate();

  const { selected } = useTab(tabId);

  useAutoLoad(state, selected);

  const users = useResource(ConnectionAccess, UsersResource, CachedMapAllKey, { active: selected });
  const teams = useResource(ConnectionAccess, TeamsResource, CachedMapAllKey, { active: selected });

  const grantedUsers = useMemo(() => computed(() => users.resource.values
    .filter(user => state.state.grantedSubjects.includes(user.userId))
  ), [state.state.grantedSubjects, users.resource]);

  const grantedTeams = useMemo(() => computed(() => teams.resource.values
    .filter(team => state.state.grantedSubjects.includes(team.teamId))
  ), [state.state.grantedSubjects, teams.resource]);

  if (!selected) {
    return null;
  }

  const loading = users.isLoading() || teams.isLoading() || state.state.loading;
  const cloud = formState.info ? isCloudConnection(formState.info) : false;
  const disabled = loading || !state.state.loaded || formState.disabled || cloud;
  let info: TLocalizationToken | null = null;

  if (formState.mode === 'edit' && state.changed) {
    info = 'ui_save_reminder';
  } else if (cloud) {
    info = 'cloud_connections_access_placeholder';
  }

  return styled(styles, BASE_CONTAINERS_STYLES)(
    <Loader state={[users, teams, state.state]}>
      {() => styled(styles, BASE_CONTAINERS_STYLES)(
        <ColoredContainer parent gap vertical>
          {!users.resource.values.length && !teams.resource.values.length ? (
            <Group keepSize large>
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
