/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2019-2026 DBeaver Corp
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { createDataContext, DATA_CONTEXT_DI_PROVIDER } from '@cloudbeaver/core-data-context';
import type { IFormState } from '@cloudbeaver/core-ui';
import { ConnectionInfoAiResource } from '../../ConnectionInfoAiResource.js';
import { ConnectionInfoAiScopeResource } from '../../ConnectionInfoAiScopeResource.js';
import { ConnectionInfoResource } from '@cloudbeaver/core-connections';
import { getConnectionFormOptionsPart, type IConnectionFormState } from '@cloudbeaver/plugin-connections';

import { ConnectionAiScopePart } from './ConnectionAiScopePart.js';

const SCOPE_PART = createDataContext<ConnectionAiScopePart>('Connection AI custom scope');

export function getConnectionAiScopePart(formState: IFormState<IConnectionFormState>): ConnectionAiScopePart {
  return formState.getPart(SCOPE_PART, context => {
    const provider = context.get(DATA_CONTEXT_DI_PROVIDER)!;
    return new ConnectionAiScopePart(
      formState,
      getConnectionFormOptionsPart(formState),
      provider.getService(ConnectionInfoAiResource),
      provider.getService(ConnectionInfoAiScopeResource),
      provider.getService(ConnectionInfoResource),
    );
  });
}
