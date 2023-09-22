/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { UsersResource } from '@cloudbeaver/core-authentication';
import { DATA_CONTEXT_FORM_STATE } from '@cloudbeaver/core-ui';
import { createDataContext, DATA_CONTEXT_DI_PROVIDER } from '@cloudbeaver/core-view';

import type { AdministrationUserFormState } from '../AdministrationUserFormState';
import type { IUserFormInfoPart } from './IUserFormInfoPart';
import { UserFormInfoPart } from './UserFormInfoPart';

export const DATA_CONTEXT_USER_FORM_INFO_PART = createDataContext<IUserFormInfoPart>('User Form Info Part', context => {
  const form = context.get(DATA_CONTEXT_FORM_STATE) as AdministrationUserFormState;
  const di = context.get(DATA_CONTEXT_DI_PROVIDER);
  const usersResource = di.getServiceByClass(UsersResource);

  return new UserFormInfoPart(form, usersResource);
});
