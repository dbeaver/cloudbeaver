/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
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
  useAutoLoad,
  useResource,
  useS,
  useTranslate,
} from '@cloudbeaver/core-blocks';
import { ConnectionInfoAuthPropertiesResource, ConnectionInfoOriginDetailsResource, ConnectionInfoResource, DatabaseAuthModelsResource, DBDriverResource } from '@cloudbeaver/core-connections';
import { type TabContainerPanelComponent, useTab } from '@cloudbeaver/core-ui';

import styles from './OriginInfo.module.css';
import type { IConnectionFormProps } from '../IConnectionFormState.js';

import { getConnectionFormOriginInfoFormPart } from './getConnectionFormOriginInfoFormPart.js';
import { getConnectionFormOptionsPart } from '../Options/getConnectionFormOptionsPart.js';

export const OriginInfo: TabContainerPanelComponent<IConnectionFormProps> = observer(function OriginInfo({ tabId, formState }) {
  const tab = useTab(tabId);
  const translate = useTranslate();
  const originInfoPart = getConnectionFormOriginInfoFormPart(formState);
  const style = useS(styles);
  const optionsPart = getConnectionFormOptionsPart(formState);

  const connectionInfoAuthPropertiesResource = useResource(OriginInfo, ConnectionInfoAuthPropertiesResource, optionsPart.connectionKey, {
    active: tab.selected,
  });
  const dbDriverResource = useResource(OriginInfo, DBDriverResource, optionsPart.state.driverId ?? null, {
    active: tab.selected,
  });

  const info = connectionInfoAuthPropertiesResource.data;
  const driver = dbDriverResource.data;
  const authModelId = optionsPart.state.authModelId ?? info?.authModel ?? driver?.defaultAuthModel ?? null;

  const databaseAuthModelsResource = useResource(OriginInfo, DatabaseAuthModelsResource, authModelId, {
    active: tab.selected,
  });

  const authModel = databaseAuthModelsResource.data;
  const providerId = authModel?.requiredAuth ?? info?.requiredAuth ?? AUTH_PROVIDER_LOCAL_ID;

  const providerLoader = useResource(OriginInfo, AuthProvidersResource, providerId, {
    active: tab.selected,
  });
  const userInfoResource = useResource(OriginInfo, UserInfoResource, undefined, {
    active: tab.selected,
  });

  const isAuthenticated = userInfoResource.resource.hasToken(providerId);

  const connectionOriginDetailsResource = useResource(OriginInfo, ConnectionInfoOriginDetailsResource, optionsPart.connectionKey, {
    active: tab.selected && isAuthenticated,
  });
  const connection = useResource(OriginInfo, ConnectionInfoResource, optionsPart.connectionKey, {
    active: tab.selected && isAuthenticated,
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
        <TextPlaceholder>{translate('core_connections_connection_no_information')}</TextPlaceholder>
      </ColoredContainer>
    );
  }

  return (
    <ColoredContainer className={s(style, { coloredContainer: true })} parent>
      <Group large gap>
        <ObjectPropertyInfoForm
          properties={connectionOriginDetailsResource.data.origin.details}
          readOnly
          small
          autoHide
        />
      </Group>
      <Loader key="overlay" className={s(style, { loader: true })} loading={connection.isLoading()} overlay />
    </ColoredContainer>
  );
});
