/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { UsersResource } from '@cloudbeaver/core-authentication';
import { createDataContext, DATA_CONTEXT_DI_PROVIDER } from '@cloudbeaver/core-data-context';
import { ServerConfigResource } from '@cloudbeaver/core-root';
import { DATA_CONTEXT_FORM_STATE } from '@cloudbeaver/core-ui';

import type { AdministrationUserFormState } from '../AdministrationUserFormState';
import { UserFormInfoPart } from './UserFormInfoPart';

export const DATA_CONTEXT_USER_FORM_INFO_PART = createDataContext<UserFormInfoPart>('User Form Info Part', context => {
  const form = context.get(DATA_CONTEXT_FORM_STATE) as AdministrationUserFormState;
  const di = context.get(DATA_CONTEXT_DI_PROVIDER);
  const usersResource = di.getServiceByClass(UsersResource);
  const serverConfigResource = di.getServiceByClass(ServerConfigResource);

  return new UserFormInfoPart(serverConfigResource, form, usersResource);
});
