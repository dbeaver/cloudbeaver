/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { AuthRolesResource, UsersMetaParametersResource, UsersResource } from '@cloudbeaver/core-authentication';
import { createDataContext, DATA_CONTEXT_DI_PROVIDER } from '@cloudbeaver/core-data-context';
import { ServerConfigResource } from '@cloudbeaver/core-root';
import type { IFormState } from '@cloudbeaver/core-ui';

import type { IUserFormState } from '../AdministrationUserFormService.js';
import { UserFormInfoPart } from './UserFormInfoPart.js';

const DATA_CONTEXT_USER_FORM_INFO_PART = createDataContext<UserFormInfoPart>('User Form Info Part');

export function getUserFormInfoPart(formState: IFormState<IUserFormState>): UserFormInfoPart {
  return formState.getPart(DATA_CONTEXT_USER_FORM_INFO_PART, context => {
    const di = context.get(DATA_CONTEXT_DI_PROVIDER)!;
    const usersResource = di.getService(UsersResource);
    const serverConfigResource = di.getService(ServerConfigResource);
    const authRolesResource = di.getService(AuthRolesResource);
    const usersMetaParametersResource = di.getService(UsersMetaParametersResource);

    return new UserFormInfoPart(authRolesResource, serverConfigResource, formState, usersResource, usersMetaParametersResource);
  });
}
