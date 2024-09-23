/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { IServiceProvider } from '@cloudbeaver/core-di';
import { FormState } from '@cloudbeaver/core-ui';

import type { IUserProfileFormState, UserProfileFormService } from './UserProfileFormService.js';

export class UserProfileFormState extends FormState<IUserProfileFormState> {
  constructor(serviceProvider: IServiceProvider, service: UserProfileFormService, config: IUserProfileFormState) {
    super(serviceProvider, service, config);
  }
}
