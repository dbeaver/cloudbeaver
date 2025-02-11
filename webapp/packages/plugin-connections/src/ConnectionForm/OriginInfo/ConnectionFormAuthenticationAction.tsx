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
import { DatabaseAuthModelsResource, DBDriverResource } from '@cloudbeaver/core-connections';

import type { IConnectionFormProps } from '../IConnectionFormProps.js';

export const AuthenticationButton: PlaceholderComponent<IConnectionFormProps> = observer(function ConnectionFormAuthenticationAction({ state }) {
  const translate = useTranslate();
  const driverMap = useResource(ConnectionFormAuthenticationAction, DBDriverResource, state.config.driverId || null);

  const driver = driverMap.data;
  const { data: authModel } = useResource(
    ConnectionFormAuthenticationAction,
    DatabaseAuthModelsResource,
    getComputed(() => state.config.authModelId || state.info?.authModel || driver?.defaultAuthModel || null),
  );

  const authentication = useAuthenticationAction({
    providerId: authModel?.requiredAuth ?? state.info?.requiredAuth ?? AUTH_PROVIDER_LOCAL_ID,
    onAuthenticate: () => state.loadConnectionInfo(),
  });

  if (authentication.authorized) {
    return null;
  }

  return (
    <Button type="button" disabled={state.disabled} mod={['outlined']} onClick={authentication.auth}>
      {translate('authentication_authenticate')}
    </Button>
  );
});

export const ConnectionFormAuthenticationAction: PlaceholderComponent<IConnectionFormProps> = observer(function ConnectionFormAuthenticationAction({
  state,
}) {
  const driverMap = useResource(ConnectionFormAuthenticationAction, DBDriverResource, state.config.driverId || null);

  const driver = driverMap.data;
  const { data: authModel } = useResource(
    ConnectionFormAuthenticationAction,
    DatabaseAuthModelsResource,
    getComputed(() => state.config.authModelId || state.info?.authModel || driver?.defaultAuthModel || null),
  );

  if (!authModel?.requiredAuth && !state.info?.requiredAuth) {
    return null;
  }

  return <AuthenticationButton state={state} />;
});
