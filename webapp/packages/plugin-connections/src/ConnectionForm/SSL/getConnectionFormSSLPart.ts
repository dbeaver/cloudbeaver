/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { createDataContext, DATA_CONTEXT_DI_PROVIDER } from '@cloudbeaver/core-data-context';
import type { IFormState } from '@cloudbeaver/core-ui';
import { ConnectionFormSSLPart } from './ConnectionFormSSLPart.js';
import type { IConnectionFormState } from '../IConnectionFormState.js';
import { ConnectionInfoNetworkHandlersResource, DBDriverResource, NetworkHandlerResource } from '@cloudbeaver/core-connections';
import { getConnectionFormOptionsPart } from '../Options/getConnectionFormOptionsPart.js';

const DATA_CONTEXT_CONNECTION_FORM_OPTIONS_PART = createDataContext<ConnectionFormSSLPart>('Connection Form SSL Part');

export function getConnectionFormSSLPart(formState: IFormState<IConnectionFormState>): ConnectionFormSSLPart {
  return formState.getPart(DATA_CONTEXT_CONNECTION_FORM_OPTIONS_PART, context => {
    const di = context.get(DATA_CONTEXT_DI_PROVIDER)!;
    const dbDriverResource = di.getService(DBDriverResource);
    const networkHandlerResource = di.getService(NetworkHandlerResource);
    const connectionInfoNetworkHandlersResource = di.getService(ConnectionInfoNetworkHandlersResource);
    const optionsPart = getConnectionFormOptionsPart(formState);

    return new ConnectionFormSSLPart(formState, dbDriverResource, networkHandlerResource, connectionInfoNetworkHandlersResource, optionsPart);
  });
}
