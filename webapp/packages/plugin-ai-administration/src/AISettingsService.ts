/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { injectable, IServiceProvider } from '@cloudbeaver/core-di';
import { FormMode } from '@cloudbeaver/core-ui';

import { AdministrationAISettingsFormService } from './AISettingsForm/AdministrationAISettingsFormService.js';
import { AdministrationAISettingsFormState } from './AISettingsForm/AdministrationAISettingsFormState.js';

@injectable(() => [AdministrationAISettingsFormService, IServiceProvider])
export class AISettingsService {
  formState: AdministrationAISettingsFormState | null;

  constructor(
    private readonly administrationAISettingsFormService: AdministrationAISettingsFormService,
    private readonly serviceProvider: IServiceProvider,
  ) {
    this.formState = null;
  }

  create(): void {
    this.dispose();
    this.formState = new AdministrationAISettingsFormState(this.serviceProvider, this.administrationAISettingsFormService);
    this.formState.setMode(FormMode.Edit);
  }

  dispose() {
    this.formState?.dispose();
    this.formState = null;
  }
}
