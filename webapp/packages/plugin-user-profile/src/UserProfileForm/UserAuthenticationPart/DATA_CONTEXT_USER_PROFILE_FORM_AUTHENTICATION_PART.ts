/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { PasswordPolicyService, UserInfoResource } from '@cloudbeaver/core-authentication';
import { createDataContext, DATA_CONTEXT_DI_PROVIDER } from '@cloudbeaver/core-data-context';
import { DATA_CONTEXT_FORM_STATE } from '@cloudbeaver/core-ui';

import type { UserProfileFormState } from '../UserProfileFormState';
import { UserProfileFormAuthenticationPart } from './UserProfileFormAuthenticationPart';

export const DATA_CONTEXT_USER_PROFILE_FORM_AUTHENTICATION_PART = createDataContext<UserProfileFormAuthenticationPart>(
  'User Profile Form Info Part',
  context => {
    const form = context.get(DATA_CONTEXT_FORM_STATE) as UserProfileFormState;
    const di = context.get(DATA_CONTEXT_DI_PROVIDER);
    const userInfoResource = di.getServiceByClass(UserInfoResource);
    const passwordPolicyService = di.getServiceByClass(PasswordPolicyService);

    return new UserProfileFormAuthenticationPart(form, userInfoResource, passwordPolicyService);
  },
);
