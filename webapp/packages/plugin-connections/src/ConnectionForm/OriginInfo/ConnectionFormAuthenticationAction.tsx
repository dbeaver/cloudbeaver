/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { AUTH_PROVIDER_LOCAL_ID } from '@cloudbeaver/core-authentication';
import { Button, getComputed, type PlaceholderComponent, useResource, useTranslate, useAuthenticationAction } from '@cloudbeaver/core-blocks';
import { ConnectionInfoAuthPropertiesResource, DatabaseAuthModelsResource, DBDriverResource } from '@cloudbeaver/core-connections';

import type { IConnectionFormProps } from '../IConnectionFormState.js';
import { getConnectionFormOptionsPart } from '../Options/getConnectionFormOptionsPart.js';

export const AuthenticationButton: PlaceholderComponent<IConnectionFormProps> = observer(function ConnectionFormAuthenticationAction({ formState }) {
  const translate = useTranslate();
  const optionsPart = getConnectionFormOptionsPart(formState);
  const driverMap = useResource(ConnectionFormAuthenticationAction, DBDriverResource, optionsPart.state.driverId || null);
  const connectionInfoAuthPropertiesResource = useResource(
    ConnectionFormAuthenticationAction,
    ConnectionInfoAuthPropertiesResource,
    optionsPart.connectionKey,
    {
      active: !!optionsPart.connectionKey,
    },
  );
  const authInfo = connectionInfoAuthPropertiesResource.data;
  const driver = driverMap.data;
  const { data: authModel } = useResource(
    ConnectionFormAuthenticationAction,
    DatabaseAuthModelsResource,
    getComputed(() => optionsPart.state.authModelId || authInfo?.authModel || driver?.defaultAuthModel || null),
  );

  const authentication = useAuthenticationAction({
    providerId: authModel?.requiredAuth ?? authInfo?.requiredAuth ?? AUTH_PROVIDER_LOCAL_ID,
    onAuthenticate: () => {
      if (!optionsPart.connectionKey) {
        return;
      }

      connectionInfoAuthPropertiesResource.resource.markOutdated(optionsPart.connectionKey);
    },
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
  const optionsPart = getConnectionFormOptionsPart(formState);
  const driverMap = useResource(ConnectionFormAuthenticationAction, DBDriverResource, optionsPart.state.driverId || null);
  const connectionInfoAuthPropertiesResource = useResource(
    ConnectionFormAuthenticationAction,
    ConnectionInfoAuthPropertiesResource,
    optionsPart.connectionKey,
    {
      active: !!optionsPart.connectionKey,
    },
  );
  const driver = driverMap.data;
  const { data: authModel } = useResource(
    ConnectionFormAuthenticationAction,
    DatabaseAuthModelsResource,
    getComputed(() => optionsPart.state.authModelId || connectionInfoAuthPropertiesResource.data?.authModel || driver?.defaultAuthModel || null),
  );

  if (!authModel?.requiredAuth && !connectionInfoAuthPropertiesResource.data?.requiredAuth) {
    return null;
  }

  return <AuthenticationButton formState={formState} />;
});
