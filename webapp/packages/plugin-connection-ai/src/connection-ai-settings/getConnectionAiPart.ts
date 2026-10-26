/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { IFormState } from '@cloudbeaver/core-ui';
import { type IConnectionFormState, getConnectionFormOptionsPart } from '@cloudbeaver/plugin-connections';
import { ConnectionAiPart } from './ConnectionAiPart.js';
import { createDataContext, DATA_CONTEXT_DI_PROVIDER } from '@cloudbeaver/core-data-context';
import { ConnectionInfoAiResource } from '../ConnectionInfoAiResource.js';

const DATA_CONTEXT_CONNECTION_FORM_AI_PART = createDataContext<ConnectionAiPart>('Connection Form AI Part');

export function getConnectionAiPart(formState: IFormState<IConnectionFormState>): ConnectionAiPart {
  return formState.getPart(DATA_CONTEXT_CONNECTION_FORM_AI_PART, context => {
    const di = context.get(DATA_CONTEXT_DI_PROVIDER)!;
    const optionsPart = getConnectionFormOptionsPart(formState);
    const connectionInfoAiResource = di.getService(ConnectionInfoAiResource);

    return new ConnectionAiPart(formState, connectionInfoAiResource, optionsPart);
  });
}
