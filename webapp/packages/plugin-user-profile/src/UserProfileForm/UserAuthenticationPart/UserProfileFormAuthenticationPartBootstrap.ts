/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { importLazyComponent } from '@cloudbeaver/core-blocks';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';

import { UserProfileFormService } from '../UserProfileFormService.js';
import { getUserProfileFormAuthenticationPart } from './getUserProfileFormAuthenticationPart.js';

const AuthenticationPanel = importLazyComponent(() => import('./AuthenticationPanel.js').then(m => m.AuthenticationPanel));

@injectable()
export class UserProfileFormAuthenticationPartBootstrap extends Bootstrap {
  constructor(private readonly userProfileFormService: UserProfileFormService) {
    super();
  }

  override register(): void {
    this.userProfileFormService.parts.add({
      key: 'authentication',
      name: 'ui_authentication',
      order: 2,
      panel: () => AuthenticationPanel,
      stateGetter: props => () => getUserProfileFormAuthenticationPart(props.formState),
    });
  }
}
