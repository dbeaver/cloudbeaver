/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';

import { AuthProvidersResource } from '@cloudbeaver/core-authentication';
import {
  ColoredContainer,
  ExceptionMessage,
  getComputed,
  Group,
  Loader,
  ObjectPropertyInfoForm,
  s,
  TextPlaceholder,
  useAutoLoad,
  useResource,
  useS,
  useTranslate,
} from '@cloudbeaver/core-blocks';
import { ConnectionInfoOriginDetailsResource, ConnectionInfoResource, createConnectionParam } from '@cloudbeaver/core-connections';
import { type TabContainerPanelComponent, useTab } from '@cloudbeaver/core-ui';

import styles from './OriginInfo.module.css';
import type { IConnectionFormPropsRefactored } from '../IConnectionFormStateRefactored.js';
import { useService } from '@cloudbeaver/core-di';
import { getConnectionFormOriginInfoFormPart } from './getConnectionFormOriginInfoFormPart.js';

export const OriginInfo: TabContainerPanelComponent<IConnectionFormPropsRefactored> = observer(function OriginInfo({ tabId, formState }) {
  const tab = useTab(tabId);
  const translate = useTranslate();
  const originInfoPart = getConnectionFormOriginInfoFormPart(formState);
  const style = useS(styles);
  const connectionInfoService = useService(ConnectionInfoResource);
  const info = connectionInfoService.get(createConnectionParam(formState.state.projectId, formState.state.config.connectionId!));
  const providerLoader = useResource(OriginInfo, AuthProvidersResource, originInfoPart.providerId);
  const connectionId = tab.selected && info ? createConnectionParam(info.projectId, info.id) : null;
  const isAuthenticated = getComputed(() => originInfoPart.isAuthenticated);
  const connectionOriginDetailsResource = useResource(OriginInfo, ConnectionInfoOriginDetailsResource, connectionId, {
    active: isAuthenticated,
  });
  const connection = useResource(OriginInfo, connectionInfoService, connectionId, {
    active: isAuthenticated,
  });

  useAutoLoad(OriginInfo, originInfoPart);

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
        <ObjectPropertyInfoForm
          properties={connectionOriginDetailsResource.data?.origin.details}
          state={originInfoPart.state}
          readOnly
          small
          autoHide
        />
      </Group>
      <Loader key="overlay" className={s(style, { loader: true })} loading={connection.isLoading()} overlay />
    </ColoredContainer>
  );
});
