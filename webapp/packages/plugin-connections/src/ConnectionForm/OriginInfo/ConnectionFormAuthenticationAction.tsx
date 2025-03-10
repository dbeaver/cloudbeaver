/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { AUTH_PROVIDER_LOCAL_ID } from '@cloudbeaver/core-authentication';
import { Button, getComputed, type PlaceholderComponent, useResource, useTranslate, useAuthenticationAction } from '@cloudbeaver/core-blocks';
import { ConnectionInfoResource, createConnectionParam, DatabaseAuthModelsResource, DBDriverResource } from '@cloudbeaver/core-connections';

import type { IConnectionFormProps } from '../IConnectionFormState.js';
import { useService } from '@cloudbeaver/core-di';

export const AuthenticationButton: PlaceholderComponent<IConnectionFormProps> = observer(function ConnectionFormAuthenticationAction({ formState }) {
  const translate = useTranslate();
  const driverMap = useResource(ConnectionFormAuthenticationAction, DBDriverResource, formState.state.config.driverId || null);
  const connectionInfoService = useService(ConnectionInfoResource);
  const info = connectionInfoService.get(createConnectionParam(formState.state.projectId, formState.state.config.connectionId!));

  const driver = driverMap.data;
  const { data: authModel } = useResource(
    ConnectionFormAuthenticationAction,
    DatabaseAuthModelsResource,
    getComputed(() => formState.state.config.authModelId || info?.authModel || driver?.defaultAuthModel || null),
  );

  const authentication = useAuthenticationAction({
    providerId: authModel?.requiredAuth ?? info?.requiredAuth ?? AUTH_PROVIDER_LOCAL_ID,
    onAuthenticate: () => formState.reload(),
  });

  if (authentication.authorized) {
    return null;
  }

  return (
    <Button type="button" disabled={formState.isDisabled} mod={['outlined']} onClick={authentication.auth}>
      {translate('authentication_authenticate')}
    </Button>
  );
});

export const ConnectionFormAuthenticationAction: PlaceholderComponent<IConnectionFormProps> = observer(function ConnectionFormAuthenticationAction({
  formState,
}) {
  const driverMap = useResource(ConnectionFormAuthenticationAction, DBDriverResource, formState.state.config.driverId || null);
  const connectionInfoService = useService(ConnectionInfoResource);
  const info = connectionInfoService.get(createConnectionParam(formState.state.projectId, formState.state.config.connectionId!));

  const driver = driverMap.data;
  const { data: authModel } = useResource(
    ConnectionFormAuthenticationAction,
    DatabaseAuthModelsResource,
    getComputed(() => formState.state.config.authModelId || info?.authModel || driver?.defaultAuthModel || null),
  );

  if (!authModel?.requiredAuth && !info?.requiredAuth) {
    return null;
  }

  return <AuthenticationButton formState={formState} />;
});
