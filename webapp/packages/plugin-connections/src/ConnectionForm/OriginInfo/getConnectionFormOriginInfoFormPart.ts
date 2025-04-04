/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { type IFormState } from '@cloudbeaver/core-ui';

import {
  ConnectionInfoAuthPropertiesResource,
  ConnectionInfoOriginDetailsResource,
  DatabaseAuthModelsResource,
  DBDriverResource,
} from '@cloudbeaver/core-connections';
import type { IConnectionFormState } from '../IConnectionFormState.js';
import { ConnectionFormOriginInfoFormPart } from './ConnectionFormOriginInfoFormPart.js';
import { createDataContext, DATA_CONTEXT_DI_PROVIDER } from '@cloudbeaver/core-data-context';
import { AuthProvidersResource, UserInfoResource } from '@cloudbeaver/core-authentication';
import { LocalizationService } from '@cloudbeaver/core-localization';
import { getConnectionFormOptionsPart } from '../Options/getConnectionFormOptionsPart.js';

const DATA_CONTEXT_CONNECTION_FORM_ORIGIN_INFO_FORM_PART = createDataContext<ConnectionFormOriginInfoFormPart>(
  'Connection Form Origin Info Form Part',
);

export function getConnectionFormOriginInfoFormPart(formState: IFormState<IConnectionFormState>): ConnectionFormOriginInfoFormPart {
  return formState.getPart(DATA_CONTEXT_CONNECTION_FORM_ORIGIN_INFO_FORM_PART, context => {
    const di = context.get(DATA_CONTEXT_DI_PROVIDER)!;
    const connectionInfoOriginDetailsResource = di.getService(ConnectionInfoOriginDetailsResource);
    const userInfoResource = di.getService(UserInfoResource);
    const databaseAuthModelsResource = di.getService(DatabaseAuthModelsResource);
    const connectionInfoAuthPropertiesResource = di.getService(ConnectionInfoAuthPropertiesResource);
    const dbDriverResource = di.getService(DBDriverResource);
    const authProvidersResource = di.getService(AuthProvidersResource);
    const localizationService = di.getService(LocalizationService);
    const optionsPart = getConnectionFormOptionsPart(formState);

    return new ConnectionFormOriginInfoFormPart(
      formState,
      connectionInfoOriginDetailsResource,
      userInfoResource,
      databaseAuthModelsResource,
      connectionInfoAuthPropertiesResource,
      dbDriverResource,
      authProvidersResource,
      localizationService,
      optionsPart,
    );
  });
}
