/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { UsersResource } from '@cloudbeaver/core-authentication';
import { createDataContext, DATA_CONTEXT_DI_PROVIDER } from '@cloudbeaver/core-data-context';
import { DATA_CONTEXT_FORM_STATE } from '@cloudbeaver/core-ui';

import type { AdministrationUserFormState } from '../AdministrationUserFormState';
import { DATA_CONTEXT_USER_FORM_INFO_PART } from '../Info/DATA_CONTEXT_USER_FORM_INFO_PART';
import { UserFormConnectionAccessPart } from './UserFormConnectionAccessPart';
import { ProjectInfoResource } from '@cloudbeaver/core-projects';

export const DATA_CONTEXT_USER_FORM_CONNECTION_ACCESS_PART = createDataContext<UserFormConnectionAccessPart>(
  'User Form Connection Access Part',
  context => {
    context.get(DATA_CONTEXT_USER_FORM_INFO_PART); // ensure that info part is loaded first

    const form = context.get(DATA_CONTEXT_FORM_STATE) as AdministrationUserFormState;
    const di = context.get(DATA_CONTEXT_DI_PROVIDER);
    const usersResource = di.getServiceByClass(UsersResource);
    const projectInfoResource = di.getServiceByClass(ProjectInfoResource);

    return new UserFormConnectionAccessPart(form, usersResource, projectInfoResource);
  },
);
