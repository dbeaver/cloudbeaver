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

import {
  BASE_CONTAINERS_STYLES, ColoredContainer, Container, Group,
  IconOrImage, Loader, TabContainerPanelComponent,
  TextPlaceholder, useMapResource, useTab,
} from '@cloudbeaver/core-blocks';
import { ConnectionsResource, DBDriverResource, isCloudConnection } from '@cloudbeaver/core-connections';
import { TLocalizationToken, useTranslate } from '@cloudbeaver/core-localization';
import { useStyles } from '@cloudbeaver/core-theming';

import type { IRoleFormProps } from '../IRoleFormProps';
import { ConnectionList } from './ConnectionList';
import { GrantedConnectionList } from './GrantedConnectionsList';
import { useGrantedConnections } from './useGrantedConnections';

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

export const GrantedConnections: TabContainerPanelComponent<IRoleFormProps> = observer(function GrantedConnections({
  tabId,
  state: formState,
}) {
  const style = useStyles(BASE_CONTAINERS_STYLES, styles);
  const translate = useTranslate();

  const { state, edit, grant, load, revoke } = useGrantedConnections(formState.config, formState.mode);

  const { selected } = useTab(tabId, load);

  const dbDriverResource = useMapResource(DBDriverResource, selected ? 'all' : null);
  const connections = useMapResource(ConnectionsResource, selected ? ConnectionsResource.keyAll : null);

  const grantedConnections = useMemo(() => computed(() => connections.resource.values
    .filter(connection => state.grantedSubjects.includes(connection.id))
  ), [state.grantedSubjects, connections.resource]);

  if (!selected) {
    return null;
  }

  let infoItem: IInfoItem | null = null;

  const unsaved = (formState.mode === 'edit' && (state.initialGrantedSubjects.length !== state.grantedSubjects.length
    || state.initialGrantedSubjects.some(subject => !state.grantedSubjects.includes(subject))));
  const cloudExists = connections.resource.values.some(isCloudConnection);

  if (cloudExists) {
    infoItem = {
      text: 'connections_connection_access_cloud_placeholder',
      icon: '/icons/info_icon.svg',
    };
  }

  if (unsaved) {
    infoItem = {
      text: 'connections_connection_access_save_reminder',
      icon: '/icons/info_icon.svg',
    };
  }

  return styled(style)(
    <Loader state={[connections, dbDriverResource, state]}>
      {() => styled(style)(
        <ColoredContainer parent gap vertical>
          {!connections.resource.values.length ? (
            <Group large>
              <TextPlaceholder>{translate('administration_roles_role_granted_connections_empty')}</TextPlaceholder>
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
                <GrantedConnectionList
                  grantedConnections={grantedConnections.get()}
                  disabled={formState.disabled}
                  onEdit={edit}
                  onRevoke={revoke}
                />
                {state.editing && (
                  <ConnectionList
                    connectionList={connections.resource.values}
                    grantedSubjects={state.grantedSubjects}
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
