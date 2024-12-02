/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { UsersResource } from '@cloudbeaver/core-authentication';
import { createDataContext, DATA_CONTEXT_DI_PROVIDER } from '@cloudbeaver/core-data-context';
import { ProjectInfoResource } from '@cloudbeaver/core-projects';
import type { IFormState } from '@cloudbeaver/core-ui';

import type { IUserFormState } from '../AdministrationUserFormService.js';
import { getUserFormInfoPart } from '../Info/getUserFormInfoPart.js';
import { UserFormConnectionAccessPart } from './UserFormConnectionAccessPart.js';

const DATA_CONTEXT_USER_FORM_CONNECTION_ACCESS_PART = createDataContext<UserFormConnectionAccessPart>('User Form Connection Access Part');

export function getUserFormConnectionAccessPart(formState: IFormState<IUserFormState>): UserFormConnectionAccessPart {
  return formState.getPart(DATA_CONTEXT_USER_FORM_CONNECTION_ACCESS_PART, context => {
    const userFormInfoPart = getUserFormInfoPart(formState);

    const di = context.get(DATA_CONTEXT_DI_PROVIDER)!;
    const usersResource = di.getService(UsersResource);
    const projectInfoResource = di.getService(ProjectInfoResource);

    return new UserFormConnectionAccessPart(formState, usersResource, projectInfoResource, userFormInfoPart);
  });
}
