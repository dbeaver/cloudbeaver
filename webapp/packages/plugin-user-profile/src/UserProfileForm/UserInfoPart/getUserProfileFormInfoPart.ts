/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { UserInfoMetaParametersResource, UserInfoResource } from '@cloudbeaver/core-authentication';
import { createDataContext, DATA_CONTEXT_DI_PROVIDER } from '@cloudbeaver/core-data-context';
import type { IFormState } from '@cloudbeaver/core-ui';

import type { IUserProfileFormState } from '../UserProfileFormService.js';
import { UserProfileFormInfoPart } from './UserProfileFormInfoPart.js';

const DATA_CONTEXT_USER_PROFILE_FORM_INFO_PART = createDataContext<UserProfileFormInfoPart>('User Profile Form Info Part');

export function getUserProfileFormInfoPart(formState: IFormState<IUserProfileFormState>): UserProfileFormInfoPart {
  return formState.getPart(DATA_CONTEXT_USER_PROFILE_FORM_INFO_PART, context => {
    const di = context.get(DATA_CONTEXT_DI_PROVIDER)!;
    const userInfoResource = di.getService(UserInfoResource);
    const userInfoMetaParametersResource = di.getService(UserInfoMetaParametersResource);

    return new UserProfileFormInfoPart(formState, userInfoResource, userInfoMetaParametersResource);
  });
}
