/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { createDataContext, DATA_CONTEXT_DI_PROVIDER } from '@cloudbeaver/core-data-context';
import type { IFormState } from '@cloudbeaver/core-ui';
import { ConnectionInfoResource } from '@cloudbeaver/core-connections';
import { ConnectionFormAccessPart } from './ConnectionFormAccessPart.js';
import { getConnectionFormOptionsPart, type IConnectionFormState } from '@cloudbeaver/plugin-connections';

const DATA_CONTEXT_CONNECTION_FORM_ACCESS_PART = createDataContext<ConnectionFormAccessPart>('Connection Form Access Part');

export function getConnectionFormAccessPart(formState: IFormState<IConnectionFormState>): ConnectionFormAccessPart {
  return formState.getPart(DATA_CONTEXT_CONNECTION_FORM_ACCESS_PART, context => {
    const di = context.get(DATA_CONTEXT_DI_PROVIDER)!;
    const connectionInfoResource = di.getService(ConnectionInfoResource);
    const optionsPart = getConnectionFormOptionsPart(formState);

    return new ConnectionFormAccessPart(formState, connectionInfoResource, optionsPart);
  });
}
