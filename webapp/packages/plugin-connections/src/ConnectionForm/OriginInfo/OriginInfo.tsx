/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { runInAction } from 'mobx';
import { observer } from 'mobx-react-lite';

import { AUTH_PROVIDER_LOCAL_ID, AuthProvidersResource, UserInfoResource } from '@cloudbeaver/core-authentication';
import {
  ColoredContainer,
  ExceptionMessage,
  Group,
  Loader,
  ObjectPropertyInfoForm,
  s,
  TextPlaceholder,
  useResource,
  useS,
  useTranslate,
} from '@cloudbeaver/core-blocks';
import {
  ConnectionInfoOriginDetailsResource,
  createConnectionParam,
  DatabaseAuthModelsResource,
  DBDriverResource,
} from '@cloudbeaver/core-connections';
import { type TabContainerPanelComponent, useTab, useTabState } from '@cloudbeaver/core-ui';

import type { IConnectionFormProps } from '../IConnectionFormProps.js';
import styles from './OriginInfo.module.css';

export const OriginInfo: TabContainerPanelComponent<IConnectionFormProps> = observer(function OriginInfo({
  tabId,
  state: { info, resource, config },
}) {
  const tab = useTab(tabId);
  const translate = useTranslate();
  const userInfoLoader = useResource(OriginInfo, UserInfoResource, undefined);
  const state = useTabState<Record<string, any>>();
  const style = useS(styles);
  const driverLoader = useResource(OriginInfo, DBDriverResource, config.driverId ?? null);
  const authModeLoader = useResource(
    OriginInfo,
    DatabaseAuthModelsResource,
    config.authModelId ?? info?.authModel ?? driverLoader.data?.defaultAuthModel ?? null,
  );

  const providerId = authModeLoader.data?.requiredAuth ?? info?.requiredAuth ?? AUTH_PROVIDER_LOCAL_ID;
  const isAuthenticated = userInfoLoader.resource.hasToken(providerId);
  const providerLoader = useResource(OriginInfo, AuthProvidersResource, providerId);
  const connectionId = tab.selected && info ? createConnectionParam(info.projectId, info.id) : null;

  const connectionOriginDetailsResource = useResource(OriginInfo, ConnectionInfoOriginDetailsResource, connectionId, {
    active: isAuthenticated,
  });
  const connection = useResource(OriginInfo, resource, connectionId, {
    active: isAuthenticated,
    onData: connection => {
      runInAction(() => {
        if (!connectionOriginDetailsResource.data?.origin.details) {
          return;
        }

        for (const property of Object.keys(state)) {
          // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
          delete state[property];
        }

        for (const property of connectionOriginDetailsResource.data.origin.details) {
          state[property.id!] = property.value;
        }
      });
    },
  });

  if (connection.isLoading()) {
    return (
      <ColoredContainer className={s(style, { coloredContainer: true })}>
        <Loader key="static" className={s(style, { loader: true })} />
      </ColoredContainer>
    );
  }

  if (connection.exception) {
    return (
      <ColoredContainer className={s(style, { coloredContainer: true })}>
        <ExceptionMessage exception={connection.exception} onRetry={connection.reload} />
      </ColoredContainer>
    );
  }

  if (!isAuthenticated) {
    return (
      <ColoredContainer className={s(style, { coloredContainer: true })} parent>
        <TextPlaceholder>
          {translate('plugin_connections_connection_cloud_auth_required', undefined, {
            providerLabel: providerLoader.data?.label,
          })}
        </TextPlaceholder>
      </ColoredContainer>
    );
  }

  if (!connectionOriginDetailsResource.data?.origin.details || connectionOriginDetailsResource.data?.origin.details.length === 0) {
    return (
      <ColoredContainer className={s(style, { coloredContainer: true })} parent>
        <TextPlaceholder>{translate('connections_administration_connection_no_information')}</TextPlaceholder>
      </ColoredContainer>
    );
  }

  return (
    <ColoredContainer className={s(style, { coloredContainer: true })} parent>
      <Group large gap>
        <ObjectPropertyInfoForm properties={connectionOriginDetailsResource.data?.origin.details} state={state} readOnly small autoHide />
      </Group>
      <Loader key="overlay" className={s(style, { loader: true })} loading={connection.isLoading()} overlay />
    </ColoredContainer>
  );
});
