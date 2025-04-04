/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useContext } from 'react';

import { AUTH_PROVIDER_LOCAL_ID } from '@cloudbeaver/core-authentication';
import { Button, getComputed, type PlaceholderComponent, useResource, useTranslate, useAuthenticationAction } from '@cloudbeaver/core-blocks';
import { ConnectionInfoResource, DatabaseAuthModelsResource, DBDriverResource } from '@cloudbeaver/core-connections';
import { ServerConfigResource } from '@cloudbeaver/core-root';

import { ConnectionFormActionsContext } from './ConnectFormActionsContext.js';
import type { IConnectionFormProps } from './IConnectionFormState.js';
import { getConnectionFormOptionsPart } from './Options/getConnectionFormOptionsPart.js';
export const ConnectionFormBaseActions: PlaceholderComponent<IConnectionFormProps> = observer(function ConnectionFormBaseActions({ formState }) {
  const actions = useContext(ConnectionFormActionsContext);

  if (!actions) {
    throw new Error('ConnectionFormActionsContext not provided');
  }

  const translate = useTranslate();
  const optionsPart = getConnectionFormOptionsPart(formState);
  const driverMap = useResource(ConnectionFormBaseActions, DBDriverResource, optionsPart.state.driverId || null);
  const driver = driverMap.data;
  const connectionInfoResource = useResource(ConnectionFormBaseActions, ConnectionInfoResource, optionsPart.connectionKey, {
    active: !!optionsPart.connectionKey,
  });

  const serverConfigResource = useResource(ConnectionFormBaseActions, ServerConfigResource, undefined);
  const { data: authModel } = useResource(
    ConnectionFormBaseActions,
    DatabaseAuthModelsResource,
    getComputed(() => optionsPart.state.authModelId || connectionInfoResource.data?.authModel || driver?.defaultAuthModel || null),
  );
  const authentication = useAuthenticationAction({
    providerId: authModel?.requiredAuth ?? connectionInfoResource.data?.requiredAuth ?? AUTH_PROVIDER_LOCAL_ID,
  });

  const authorized = authentication.providerId === AUTH_PROVIDER_LOCAL_ID || authentication.authorized;
  const disableTest = serverConfigResource.data?.distributed && !!optionsPart.state.sharedCredentials;

  return (
    <>
      {actions.onCancel && (
        <Button type="button" disabled={formState.isDisabled} mod={['outlined']} onClick={actions.onCancel}>
          {translate('ui_processing_cancel')}
        </Button>
      )}
      {!disableTest && (
        <Button type="button" disabled={formState.isDisabled || !authorized} mod={['outlined']} loader onClick={actions['test']}>
          {translate('connections_connection_test')}
        </Button>
      )}
      <Button
        type="button"
        disabled={formState.isDisabled || formState.isReadOnly || !formState.isChanged}
        mod={['unelevated']}
        loader
        onClick={actions['save']}
      >
        {translate(formState.mode === 'edit' ? 'ui_processing_save' : 'ui_processing_create')}
      </Button>
    </>
  );
});
