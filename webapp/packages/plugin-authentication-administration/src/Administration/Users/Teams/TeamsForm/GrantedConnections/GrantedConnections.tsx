/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useState } from 'react';

import {
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
import {
  type ConnectionInfoCustomOptions,
  ConnectionInfoCustomOptionsResource,
  type ConnectionInfoOrigin,
  ConnectionInfoOriginResource,
  ConnectionInfoProjectKey,
  DBDriverResource,
  isCloudConnection,
} from '@cloudbeaver/core-connections';
import type { TLocalizationToken } from '@cloudbeaver/core-localization';
import { isGlobalProject, type ProjectInfo, ProjectInfoResource } from '@cloudbeaver/core-projects';
import { CachedMapAllKey } from '@cloudbeaver/core-resource';
import { type TabContainerPanelComponent, useTab, useTabState } from '@cloudbeaver/core-ui';

import type { TeamFormProps } from '../TeamsAdministrationFormService.js';
import { ConnectionList } from './ConnectionList.js';
import style from './GrantedConnections.module.css';
import type { GrantedConnectionsFormPart } from './GrantedConnectionsFormPart.js';
import { GrantedConnectionList } from './GrantedConnectionsList.js';

export const GrantedConnections: TabContainerPanelComponent<TeamFormProps> = observer(function GrantedConnections({ tabId, formState }) {
  const styles = useS(style);
  const translate = useTranslate();

  const tabState = useTabState<GrantedConnectionsFormPart>();
  const { selected } = useTab(tabId);
  const loaded = tabState.isLoaded();
  const [edit, setEdit] = useState(false);
  const projects = useResource(GrantedConnections, ProjectInfoResource, CachedMapAllKey);

  const globalConnectionsKey = ConnectionInfoProjectKey(
    ...(projects.data as Array<ProjectInfo | undefined>).filter(isGlobalProject).map(project => project.id),
  );

  useResource(GrantedConnections, DBDriverResource, CachedMapAllKey, { active: selected });

  const connectionsLoader = useResource(GrantedConnections, ConnectionInfoCustomOptionsResource, globalConnectionsKey, { active: selected });
  const connectionsOriginLoader = useResource(GrantedConnections, ConnectionInfoOriginResource, globalConnectionsKey, { active: selected });

  const connections = connectionsLoader.data as ConnectionInfoCustomOptions[];

  const grantedConnections = getComputed(() => connections.filter(connection => tabState.state.grantedSubjects.includes(connection.id)));
  const connectionsOrigins = (connectionsOriginLoader.data ?? []) as ConnectionInfoOrigin[];

  function toggleEdit() {
    setEdit(value => !value);
  }

  useAutoLoad(GrantedConnections, tabState, selected && !loaded);

  if (!selected) {
    return null;
  }

  let info: TLocalizationToken | null = null;

  const cloudExists = connectionsOrigins.some(connectionOrigin => isCloudConnection(connectionOrigin.origin));

  if (cloudExists) {
    info = 'cloud_connections_access_placeholder';
  }

  if (formState.mode === 'edit' && tabState.isChanged && !formState.isDisabled) {
    info = 'ui_save_reminder';
  }

  return (
    <Loader className={s(styles, { loader: true })} state={tabState}>
      {() => (
        <Container className={s(styles, { box: true })} parent gap vertical>
          {!connections.length ? (
            <Group className={s(styles, { placeholderBox: true })} large>
              <TextPlaceholder>{translate('administration_teams_team_granted_connections_empty')}</TextPlaceholder>
            </Group>
          ) : (
            <>
              {info && <InfoItem info={info} />}
              <Container gap overflow>
                <GrantedConnectionList
                  grantedConnections={grantedConnections}
                  connectionsOrigins={connectionsOrigins}
                  disabled={formState.isDisabled}
                  onEdit={toggleEdit}
                  onRevoke={tabState.revoke}
                />
                {edit && (
                  <ConnectionList
                    connectionList={connections}
                    connectionsOrigins={connectionsOrigins}
                    grantedSubjects={tabState.state.grantedSubjects}
                    disabled={formState.isDisabled}
                    onGrant={tabState.grant}
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
