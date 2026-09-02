/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { injectable, IServiceProvider } from '@cloudbeaver/core-di';
import { FormMode } from '@cloudbeaver/core-ui';
import { AISettingsResource } from '@cloudbeaver/plugin-ai';

import { AdministrationAISettingsFormService } from './AISettingsForm/AdministrationAISettingsFormService.js';
import { AdministrationAISettingsFormState } from './AISettingsForm/AdministrationAISettingsFormState.js';
import { getAdministrationAISettingsFormInfoPart } from './AISettingsForm/getAdministrationAISettingsFormInfoPart.js';

@injectable(() => [AdministrationAISettingsFormService, IServiceProvider, AISettingsResource])
export class AISettingsService {
  formState: AdministrationAISettingsFormState | null;

  constructor(
    private readonly administrationAISettingsFormService: AdministrationAISettingsFormService,
    private readonly serviceProvider: IServiceProvider,
    private readonly aiSettingsResource: AISettingsResource,
  ) {
    this.formState = null;
  }

  create(): void {
    this.dispose();
    this.formState = new AdministrationAISettingsFormState(this.serviceProvider, this.administrationAISettingsFormService);
    this.formState.setMode(FormMode.Edit);
  }

  dispose(): void {
    this.formState?.dispose();
    this.formState = null;
  }

  isEffectiveDefaultProfile(profileId: string): boolean {
    const persistedProfileId = this.aiSettingsResource.data?.defaultConfiguration;
    const selectedProfileId = this.formState ? getAdministrationAISettingsFormInfoPart(this.formState).state.defaultConfiguration : null;
    return profileId === persistedProfileId || profileId === selectedProfileId;
  }
}
