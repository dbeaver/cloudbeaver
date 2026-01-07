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
import { ConnectionInfoResource } from '@cloudbeaver/core-connections';
import { ProjectInfoResource } from '@cloudbeaver/core-projects';

import { ConnectionViewPart } from './ConnectionViewPart.js';
import { ConnectionViewService } from './ConnectionViewService.js';

const DATA_CONTEXT_CONNECTION_FORM_VIEW_PART = createDataContext<ConnectionViewPart>('Connection Form View Part');

export function getConnectionViewPart(formState: IFormState<IConnectionFormState>): ConnectionViewPart {
  return formState.getPart(DATA_CONTEXT_CONNECTION_FORM_VIEW_PART, context => {
    const di = context.get(DATA_CONTEXT_DI_PROVIDER)!;
    const optionsPart = getConnectionFormOptionsPart(formState);
    const connectionInfoResource = di.getService(ConnectionInfoResource);
    const connectionViewService = di.getService(ConnectionViewService);
    const projectInfoResource = di.getService(ProjectInfoResource);

    return new ConnectionViewPart(formState, optionsPart, connectionInfoResource, connectionViewService, projectInfoResource);
  });
}
