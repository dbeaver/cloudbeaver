/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { createDataContext, DATA_CONTEXT_DI_PROVIDER } from '@cloudbeaver/core-data-context';
import type { IFormState } from '@cloudbeaver/core-ui';
import { ConnectionInfoResource } from '@cloudbeaver/core-connections';

import { ConnectionPreferencesFormInfoPart } from './ConnectionPreferencesFormInfoPart.js';
import type { IConnectionPreferencesFormState } from '../IConnectionPreferencesFormState.js';

const DATA_CONTEXT_TEAM_FORM_OPTIONS_PART = createDataContext<ConnectionPreferencesFormInfoPart>('Connection Preferences Info Part');

export function getConnectionPreferencesFormInfoPart(formState: IFormState<IConnectionPreferencesFormState>): ConnectionPreferencesFormInfoPart {
  return formState.getPart(DATA_CONTEXT_TEAM_FORM_OPTIONS_PART, context => {
    const di = context.get(DATA_CONTEXT_DI_PROVIDER)!;
    const connectionInfoResource = di.getService(ConnectionInfoResource);

    return new ConnectionPreferencesFormInfoPart(formState, connectionInfoResource);
  });
}
