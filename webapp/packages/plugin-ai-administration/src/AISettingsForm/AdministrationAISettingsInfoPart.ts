/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { CachedMapAllKey } from '@cloudbeaver/core-resource';
import type { IExecutionContextProvider } from '@cloudbeaver/core-executor';
import { FormPart, formValidationContext, type IFormState } from '@cloudbeaver/core-ui';

import { AIProfilesResource } from '../AIProfiles/AIProfilesResource.js';
import type { AISettingsResource } from '../AISettingsResource.js';
import { LANGUAGE_VALIDATION_REGEX } from './getLanguageOptions.js';
import type { IAdministrationAIInfoState } from './IAdministrationAIInfoState.js';

const DEFAULT_STATE_GETTER: () => IAdministrationAIInfoState = () => ({
  defaultConfiguration: null,
  language: null,
});

export class AdministrationAISettingsInfoPart extends FormPart<IAdministrationAIInfoState, null> {
  constructor(
    formState: IFormState<null>,
    private readonly aiSettingsResource: AISettingsResource,
    private readonly aiProfilesResource: AIProfilesResource,
  ) {
    super(formState, DEFAULT_STATE_GETTER());
  }

  override isOutdated(): boolean {
    return this.aiSettingsResource.isOutdated() || this.aiProfilesResource.isOutdated(CachedMapAllKey);
  }

  override isLoaded(): boolean {
    return this.loaded && this.aiSettingsResource.isLoaded() && this.aiProfilesResource.isLoaded(CachedMapAllKey);
  }

  protected override format(): void {
    this.state.language = this.state.language?.trim() ?? null;
  }

  protected override validate(data: IFormState<null>, contexts: IExecutionContextProvider<IFormState<null>>): void {
    const validation = contexts.getContext(formValidationContext);
    const language = this.state.language?.trim();

    if (language && !LANGUAGE_VALIDATION_REGEX.test(language)) {
      validation.error('plugin_ai_administration_language_validation_error');
    }

    if (language && language.length > 128) {
      validation.error('plugin_ai_administration_language_length_validation_error');
    }
  }

  protected override async saveChanges(): Promise<void> {
    if (!this.state.defaultConfiguration) {
      return;
    }

    await this.aiSettingsResource.saveSettings({
      defaultConfiguration: this.state.defaultConfiguration,
      language: this.state.language ?? undefined,
    });
  }

  protected override async loader(): Promise<void> {
    const [settings] = await Promise.all([this.aiSettingsResource.load(), this.aiProfilesResource.load(CachedMapAllKey)]);

    const defaultConfiguration = settings?.defaultConfiguration ?? null;
    const hasDefaultConfiguration =
      defaultConfiguration !== null && this.aiProfilesResource.values.some(profile => profile.id === defaultConfiguration);

    this.setInitialState({
      defaultConfiguration: hasDefaultConfiguration ? defaultConfiguration : null,
      language: settings?.language ?? null,
    });
  }
}
