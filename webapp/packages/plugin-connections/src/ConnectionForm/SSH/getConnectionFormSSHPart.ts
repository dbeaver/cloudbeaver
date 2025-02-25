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
import type { IConnectionFormRefactoredState } from '../ConnectionFormServiceRefactored.js';
import { ConnectionInfoResource } from '@cloudbeaver/core-connections';

const DATA_CONTEXT_CONNECTION_FORM_OPTIONS_PART = createDataContext<ConnectionFormSSHPart>('Connection Options Form Part');

export function getConnectionFormSSHPart(formState: IFormState<IConnectionFormRefactoredState>): ConnectionFormSSHPart {
  return formState.getPart(DATA_CONTEXT_CONNECTION_FORM_OPTIONS_PART, context => {
    const di = context.get(DATA_CONTEXT_DI_PROVIDER)!;
    const connectionInfoResource = di.getService(ConnectionInfoResource);

    return new ConnectionFormSSHPart(formState, connectionInfoResource);
  });
}
