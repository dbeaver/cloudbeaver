/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { createDataContext, DATA_CONTEXT_DI_PROVIDER } from '@cloudbeaver/core-data-context';
import type { IFormState } from '@cloudbeaver/core-ui';
import { ConnectionFormSSHPart } from './ConnectionFormSSHPart.js';
import { ConnectionInfoNetworkHandlersResource } from '@cloudbeaver/core-connections';
import type { IConnectionFormState } from '../IConnectionFormState.js';
import { getConnectionFormOptionsPart } from '../Options/getConnectionFormOptionsPart.js';

const DATA_CONTEXT_CONNECTION_FORM_OPTIONS_PART = createDataContext<ConnectionFormSSHPart>('Connection Form SSH Part');

export function getConnectionFormSSHPart(formState: IFormState<IConnectionFormState>): ConnectionFormSSHPart {
  return formState.getPart(DATA_CONTEXT_CONNECTION_FORM_OPTIONS_PART, context => {
    const di = context.get(DATA_CONTEXT_DI_PROVIDER)!;
    const connectionInfoNetworkHandlersResource = di.getService(ConnectionInfoNetworkHandlersResource);
    const optionsPart = getConnectionFormOptionsPart(formState);

    return new ConnectionFormSSHPart(formState, connectionInfoNetworkHandlersResource, optionsPart);
  });
}
