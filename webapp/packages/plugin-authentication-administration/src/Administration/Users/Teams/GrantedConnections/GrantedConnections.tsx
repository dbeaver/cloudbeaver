/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

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
import { Connection, ConnectionInfoProjectKey, ConnectionInfoResource, DBDriverResource, isCloudConnection } from '@cloudbeaver/core-connections';
import type { TLocalizationToken } from '@cloudbeaver/core-localization';
import { isGlobalProject, ProjectInfo, ProjectInfoResource } from '@cloudbeaver/core-projects';
import { CachedMapAllKey } from '@cloudbeaver/core-resource';
import { TabContainerPanelComponent, useTab } from '@cloudbeaver/core-ui';

import type { ITeamFormProps } from '../ITeamFormProps';
import { ConnectionList } from './ConnectionList';
import style from './GrantedConnections.m.css';
import { GrantedConnectionList } from './GrantedConnectionsList';
import { useGrantedConnections } from './useGrantedConnections';

export const GrantedConnections: TabContainerPanelComponent<ITeamFormProps> = observer(function GrantedConnections({ tabId, state: formState }) {
  const styles = useS(style);
  const translate = useTranslate();

  const state = useGrantedConnections(formState.config, formState.mode);
  const { selected } = useTab(tabId);
  const loaded = state.state.loaded;

  const projects = useResource(GrantedConnections, ProjectInfoResource, CachedMapAllKey);

  const globalConnectionsKey = ConnectionInfoProjectKey(
    ...(projects.data as Array<ProjectInfo | undefined>).filter(isGlobalProject).map(project => project.id),
  );

  useResource(GrantedConnections, DBDriverResource, CachedMapAllKey, { active: selected });

  const connectionsLoader = useResource(GrantedConnections, ConnectionInfoResource, globalConnectionsKey, { active: selected });

  const connections = connectionsLoader.data as Connection[];

  const grantedConnections = getComputed(() => connections.filter(connection => state.state.grantedSubjects.includes(connection.id)));

  useAutoLoad(GrantedConnections, state, selected && !loaded);

  if (!selected) {
    return null;
  }

  let info: TLocalizationToken | null = null;

  const cloudExists = connections.some(isCloudConnection);

  if (cloudExists) {
    info = 'cloud_connections_access_placeholder';
  }

  if (formState.mode === 'edit' && state.changed) {
    info = 'ui_save_reminder';
  }

  return (
    <Loader className={s(styles, { loader: true })} state={[state.state]}>
      {() => (
        <ColoredContainer className={s(styles, { box: true })} parent gap vertical>
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
                  disabled={formState.disabled}
                  onEdit={state.edit}
                  onRevoke={state.revoke}
                />
                {state.state.editing && (
                  <ConnectionList
                    connectionList={connections}
                    grantedSubjects={state.state.grantedSubjects}
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
