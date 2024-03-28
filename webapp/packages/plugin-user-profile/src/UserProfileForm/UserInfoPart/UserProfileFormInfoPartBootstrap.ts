/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { importLazyComponent } from '@cloudbeaver/core-blocks';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';

import { UserProfileFormService } from '../UserProfileFormService';
import { DATA_CONTEXT_USER_PROFILE_FORM_INFO_PART } from './DATA_CONTEXT_USER_PROFILE_FORM_INFO_PART';

const UserProfileFormInfo = importLazyComponent(() => import('./UserProfileFormInfo').then(m => m.UserProfileFormInfo));

@injectable()
export class UserProfileFormInfoPartBootstrap extends Bootstrap {
  constructor(private readonly userProfileFormService: UserProfileFormService) {
    super();
  }

  register(): void {
    this.userProfileFormService.parts.add({
      key: 'info',
      name: 'plugin_user_profile_info',
      order: 1,
      panel: () => UserProfileFormInfo,
      stateGetter: props => () => props.formState.getPart(DATA_CONTEXT_USER_PROFILE_FORM_INFO_PART),
    });
  }
}
