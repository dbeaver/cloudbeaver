/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { IFormState } from '@cloudbeaver/core-ui';
import { type IConnectionFormState, getConnectionFormOptionsPart } from '@cloudbeaver/plugin-connections';
import { createDataContext, DATA_CONTEXT_DI_PROVIDER } from '@cloudbeaver/core-data-context';
import { DefaultNavigatorSettingsResource } from '@cloudbeaver/core-root';

import { ConnectionViewPart } from './ConnectionViewPart.js';
import { ConnectionViewService } from './ConnectionViewService.js';
import { ConnectionViewResource } from './ConnectionViewResource.js';

const DATA_CONTEXT_CONNECTION_FORM_VIEW_PART = createDataContext<ConnectionViewPart>('Connection Form View Part');

export function getConnectionViewPart(formState: IFormState<IConnectionFormState>): ConnectionViewPart {
  return formState.getPart(DATA_CONTEXT_CONNECTION_FORM_VIEW_PART, context => {
    const di = context.get(DATA_CONTEXT_DI_PROVIDER)!;
    const optionsPart = getConnectionFormOptionsPart(formState);
    const connectionViewService = di.getService(ConnectionViewService);
    const connectionViewResource = di.getService(ConnectionViewResource);
    const defaultNavigatorSettingsResource = di.getService(DefaultNavigatorSettingsResource);

    return new ConnectionViewPart(formState, optionsPart, connectionViewService, connectionViewResource, defaultNavigatorSettingsResource);
  });
}
