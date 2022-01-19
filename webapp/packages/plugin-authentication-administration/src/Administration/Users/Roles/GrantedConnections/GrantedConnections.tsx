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

import { TabContainerPanelComponent, useTab } from '@cloudbeaver/core-ui';
import {
  BASE_CONTAINERS_STYLES, ColoredContainer, Container, Group,
  InfoItem, Loader, TextPlaceholder, useMapResource
} from '@cloudbeaver/core-blocks';
import { DBDriverResource, isCloudConnection } from '@cloudbeaver/core-connections';
import { TLocalizationToken, useTranslate } from '@cloudbeaver/core-localization';
import { CachedMapAllKey } from '@cloudbeaver/core-sdk';
import { useStyles } from '@cloudbeaver/core-theming';
import { ConnectionsResource } from '@cloudbeaver/plugin-connections-administration';

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
  Loader {
    z-index: 2;
  }
`;

export const GrantedConnections: TabContainerPanelComponent<IRoleFormProps> = observer(function GrantedConnections({
  tabId,
  state: formState,
}) {
  const style = useStyles(BASE_CONTAINERS_STYLES, styles);
  const translate = useTranslate();

  const state = useGrantedConnections(formState.config, formState.mode);
  const { selected } = useTab(tabId);

  const dbDriverResource = useMapResource(
    GrantedConnections,
    DBDriverResource,
    CachedMapAllKey,
    { isActive: () => selected }
  );
  const connections = useMapResource(
    GrantedConnections,
    ConnectionsResource,
    CachedMapAllKey,
    { isActive: () => selected }
  );

  const grantedConnections = useMemo(() => computed(() => connections.resource.values
    .filter(connection => state.state.grantedSubjects.includes(connection.id))
  ), [state.state.grantedSubjects, connections.resource]);

  useEffect(() => {
    if (selected && !state.state.loaded) {
      state.load();
    }
  }, [selected, state.state.loaded]);

  if (!selected) {
    return null;
  }

  let info: TLocalizationToken | null = null;

  const cloudExists = connections.resource.values.some(isCloudConnection);

  if (cloudExists) {
    info = 'cloud_connections_access_placeholder';
  }

  if (formState.mode === 'edit' && state.changed) {
    info = 'ui_save_reminder';
  }

  return styled(style)(
    <Loader state={[connections, dbDriverResource, state.state]}>
      {() => styled(style)(
        <ColoredContainer parent gap vertical>
          {!connections.resource.values.length ? (
            <Group large>
              <TextPlaceholder>{translate('administration_roles_role_granted_connections_empty')}</TextPlaceholder>
            </Group>
          ) : (
            <>
              {info && <InfoItem info={info} />}
              <Container gap overflow>
                <GrantedConnectionList
                  grantedConnections={grantedConnections.get()}
                  disabled={formState.disabled}
                  onEdit={state.edit}
                  onRevoke={state.revoke}
                />
                {state.state.editing && (
                  <ConnectionList
                    connectionList={connections.resource.values}
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
