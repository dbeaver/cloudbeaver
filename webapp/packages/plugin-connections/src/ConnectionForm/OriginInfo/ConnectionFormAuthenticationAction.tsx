/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { getComputed, type PlaceholderComponent, useResource } from '@cloudbeaver/core-blocks';
import { ConnectionInfoAuthPropertiesResource, DatabaseAuthModelsResource, DBDriverResource } from '@cloudbeaver/core-connections';

import type { IConnectionFormProps } from '../IConnectionFormState.js';
import { getConnectionFormOptionsPart } from '../Options/getConnectionFormOptionsPart.js';
import { ConnectionFormAuthenticationButton } from './ConnectionFormAuthenticationButton.js';

export const ConnectionFormAuthenticationAction: PlaceholderComponent<IConnectionFormProps> = observer(function ConnectionFormAuthenticationAction({
  formState,
}) {
  const optionsPart = getConnectionFormOptionsPart(formState);
  const driverMap = useResource(ConnectionFormAuthenticationAction, DBDriverResource, optionsPart.state.driverId || null);
  const connectionInfoService = useResource(ConnectionFormAuthenticationAction, ConnectionInfoAuthPropertiesResource, optionsPart.connectionKey);
  const driver = driverMap.data;
  const { data: authModel } = useResource(
    ConnectionFormAuthenticationAction,
    DatabaseAuthModelsResource,
    getComputed(() => optionsPart.state.authModelId || connectionInfoService.data?.authModel || driver?.defaultAuthModel || null),
  );

  if (!authModel?.requiredAuth && !connectionInfoService.data?.requiredAuth) {
    return null;
  }

  return <ConnectionFormAuthenticationButton formState={formState} />;
});
