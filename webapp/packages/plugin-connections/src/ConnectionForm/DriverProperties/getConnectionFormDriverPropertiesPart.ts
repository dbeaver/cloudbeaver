/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { createDataContext, DATA_CONTEXT_DI_PROVIDER } from '@cloudbeaver/core-data-context';
import type { IFormState } from '@cloudbeaver/core-ui';
import { ConnectionFormDriverPropertiesPart } from './ConnectionFormDriverPropertiesPart.js';
import { ConnectionInfoPropertiesResource } from '@cloudbeaver/core-connections';
import type { IConnectionFormState } from '../IConnectionFormState.js';
import { getConnectionFormOptionsPart } from '../Options/getConnectionFormOptionsPart.js';

const DATA_CONTEXT_CONNECTION_FORM_DRIVER_PROPERTIES_PART = createDataContext<ConnectionFormDriverPropertiesPart>(
  'Connection Form Driver Properties Part',
);

export function getConnectionFormDriverPropertiesPart(formState: IFormState<IConnectionFormState>): ConnectionFormDriverPropertiesPart {
  return formState.getPart(DATA_CONTEXT_CONNECTION_FORM_DRIVER_PROPERTIES_PART, context => {
    const di = context.get(DATA_CONTEXT_DI_PROVIDER)!;
    const connectionInfoPropertiesResource = di.getService(ConnectionInfoPropertiesResource);
    const optionsPart = getConnectionFormOptionsPart(formState);

    return new ConnectionFormDriverPropertiesPart(formState, connectionInfoPropertiesResource, optionsPart);
  });
}
