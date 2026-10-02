/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable, IServiceProvider } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { LocalizationService } from '@cloudbeaver/core-localization';
import { FormBaseService, FormMode, FormState } from '@cloudbeaver/core-ui';

import type { IAIProfileCredentialsFormState } from './IAIProfileCredentialsFormState.js';

@injectable(() => [LocalizationService, NotificationService, IServiceProvider])
export class AIProfileCredentialsFormService extends FormBaseService<IAIProfileCredentialsFormState> {
  constructor(
    localizationService: LocalizationService,
    notificationService: NotificationService,
    private readonly serviceProvider: IServiceProvider,
  ) {
    super(localizationService, notificationService, 'AIProfileCredentialsForm');
  }

  create(profileId: string): FormState<IAIProfileCredentialsFormState> {
    return new FormState(this.serviceProvider, this, { profileId }).setMode(FormMode.Edit);
  }
}
