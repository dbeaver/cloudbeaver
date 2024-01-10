/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { runInAction } from 'mobx';
import { observer } from 'mobx-react-lite';
import styled, { css } from 'reshadow';

import { AUTH_PROVIDER_LOCAL_ID, AuthProvidersResource, UserInfoResource } from '@cloudbeaver/core-authentication';
import {
  ColoredContainer,
  ExceptionMessage,
  Group,
  Loader,
  ObjectPropertyInfoForm,
  TextPlaceholder,
  useResource,
  useStyles,
  useTranslate,
} from '@cloudbeaver/core-blocks';
import { createConnectionParam, DatabaseAuthModelsResource, DBDriverResource } from '@cloudbeaver/core-connections';
import { TabContainerPanelComponent, useTab, useTabState } from '@cloudbeaver/core-ui';

import type { IConnectionFormProps } from '../IConnectionFormProps';

const style = css`
  Loader {
    height: 100%;
  }
  ColoredContainer {
    flex: 1;
    overflow: auto;
  }
`;

export const OriginInfo: TabContainerPanelComponent<IConnectionFormProps> = observer(function OriginInfo({
  tabId,
  state: { info, resource, config },
}) {
  const tab = useTab(tabId);
  const translate = useTranslate();
  const userInfoLoader = useResource(OriginInfo, UserInfoResource, undefined);
  const state = useTabState<Record<string, any>>();
  const styles = useStyles(style);
  const driverLoader = useResource(OriginInfo, DBDriverResource, config.driverId ?? null);
  const authModeLoader = useResource(
    OriginInfo,
    DatabaseAuthModelsResource,
    config.authModelId ?? info?.authModel ?? driverLoader.data?.defaultAuthModel ?? null,
  );

  const providerId = authModeLoader.data?.requiredAuth ?? info?.requiredAuth ?? AUTH_PROVIDER_LOCAL_ID;
  const isAuthenticated = userInfoLoader.resource.hasToken(providerId);
  const providerLoader = useResource(OriginInfo, AuthProvidersResource, providerId);

  const connection = useResource(
    OriginInfo,
    resource,
    {
      key: tab.selected && info ? createConnectionParam(info.projectId, info.id) : null,
      includes: ['includeOrigin', 'customIncludeOriginDetails'] as const,
    },
    {
      active: isAuthenticated,
      onData: connection => {
        runInAction(() => {
          if (!connection.origin.details) {
            return;
          }

          for (const property of Object.keys(state)) {
            // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
            delete state[property];
          }

          for (const property of connection.origin.details) {
            state[property.id!] = property.value;
          }
        });
      },
    },
  );

  if (connection.isLoading()) {
    return styled(styles)(
      <ColoredContainer>
        <Loader key="static" />
      </ColoredContainer>,
    );
  }

  if (connection.exception) {
    return styled(styles)(
      <ColoredContainer>
        <ExceptionMessage exception={connection.exception} onRetry={connection.reload} />
      </ColoredContainer>,
    );
  }

  if (!isAuthenticated) {
    return styled(styles)(
      <ColoredContainer parent>
        <TextPlaceholder>
          {translate('connections_public_connection_cloud_auth_required', undefined, {
            providerLabel: providerLoader.data?.label,
          })}
        </TextPlaceholder>
      </ColoredContainer>,
    );
  }

  if (!connection.data?.origin.details || connection.data.origin.details.length === 0) {
    return styled(styles)(
      <ColoredContainer parent>
        <TextPlaceholder>{translate('connections_administration_connection_no_information')}</TextPlaceholder>
      </ColoredContainer>,
    );
  }

  return styled(styles)(
    <ColoredContainer parent>
      <Group large gap>
        <ObjectPropertyInfoForm properties={connection.data.origin.details} state={state} readOnly small autoHide />
      </Group>
      <Loader key="overlay" loading={connection.isLoading()} overlay />
    </ColoredContainer>,
  );
});
