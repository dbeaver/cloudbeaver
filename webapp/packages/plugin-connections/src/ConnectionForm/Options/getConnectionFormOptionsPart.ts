/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { createDataContext, DATA_CONTEXT_DI_PROVIDER } from '@cloudbeaver/core-data-context';
import type { IFormState } from '@cloudbeaver/core-ui';
import { ConnectionFormOptionsPart } from './ConnectionFormOpitonsPart.js';
import type { IConnectionFormRefactoredState } from '../ConnectionFormServiceRefactored.js';
import { ConnectionInfoResource, DatabaseAuthModelsResource, DBDriverResource } from '@cloudbeaver/core-connections';
import { ProjectInfoResource } from '@cloudbeaver/core-projects';
import { AuthProvidersResource, UserInfoResource } from '@cloudbeaver/core-authentication';
import { LocalizationService } from '@cloudbeaver/core-localization';

const DATA_CONTEXT_CONNECTION_FORM_OPTIONS_PART = createDataContext<ConnectionFormOptionsPart>('Connection Form Options Part');

export function getConnectionFormOptionsPart(formState: IFormState<IConnectionFormRefactoredState>): ConnectionFormOptionsPart {
  return formState.getPart(DATA_CONTEXT_CONNECTION_FORM_OPTIONS_PART, context => {
    const di = context.get(DATA_CONTEXT_DI_PROVIDER)!;
    const dbDriverResource = di.getService(DBDriverResource);
    const projectInfoResource = di.getService(ProjectInfoResource);
    const databaseAuthModelsResource = di.getService(DatabaseAuthModelsResource);
    const userInfoResource = di.getService(UserInfoResource);
    const connectionInfoResource = di.getService(ConnectionInfoResource);
    const authProvidersResource = di.getService(AuthProvidersResource);
    const localizationService = di.getService(LocalizationService);

    return new ConnectionFormOptionsPart(
      formState,
      dbDriverResource,
      projectInfoResource,
      databaseAuthModelsResource,
      userInfoResource,
      connectionInfoResource,
      authProvidersResource,
      localizationService,
    );
  });
}
