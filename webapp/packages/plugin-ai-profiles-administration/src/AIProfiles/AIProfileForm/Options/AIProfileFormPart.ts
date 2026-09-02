/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { runInAction } from 'mobx';

import { FormMode, FormPart, formValidationContext, type IFormState } from '@cloudbeaver/core-ui';
import type { IExecutionContextProvider } from '@cloudbeaver/core-executor';
import type { AiEngineConfig } from '@cloudbeaver/core-sdk';
import { getUniqueName, trimObjectValues } from '@cloudbeaver/core-utils';
import { AIProfileCredentialsService, AIProfilesResource } from '@cloudbeaver/plugin-ai-profiles';

import { AIEnginePropertiesResource } from '../../AIEnginePropertiesResource.js';
import { AIProfilesAdministrationService, type AIAdminProfile, type AIProfileInput } from '../../AIProfilesAdministrationService.js';
import { getObjectPropertiesValues } from '../../utils/getObjectPropertiesValues.js';
import { prepareProperties } from '../../utils/prepareProperties.js';
import type { IAIProfileFormState } from '../IAIProfileFormState.js';
import type { IAIProfileOptionsState } from './AIProfileSchema.js';

const GLOBAL_PROPERTY_ID = 'global';

const getDefaultState = (): IAIProfileOptionsState => ({
  name: '',
  engineId: '',
  global: true,
  properties: {},
});

export class AIProfileFormPart extends FormPart<IAIProfileOptionsState, IAIProfileFormState> {
  constructor(
    formState: IFormState<IAIProfileFormState>,
    private readonly aiProfilesResource: AIProfilesResource,
    private readonly aiProfilesAdministrationService: AIProfilesAdministrationService,
    private readonly aiProfileCredentialsService: AIProfileCredentialsService,
    private readonly aiEnginePropertiesResource: AIEnginePropertiesResource,
  ) {
    super(formState, getDefaultState());
  }

  override isOutdated(): boolean {
    if (this.formState.mode !== FormMode.Edit) {
      return false;
    }

    if (this.aiProfilesResource.isOutdated(this.formState.state.profileId)) {
      return true;
    }

    const profile = this.aiProfilesResource.get(this.formState.state.profileId);

    if (!profile) {
      return false;
    }

    return this.aiEnginePropertiesResource.isOutdated(profile.engineId);
  }

  override isLoaded(): boolean {
    if (this.formState.mode !== FormMode.Edit) {
      return this.loaded;
    }

    if (!this.loaded || !this.aiProfilesResource.isLoaded(this.formState.state.profileId)) {
      return false;
    }

    const profile = this.aiProfilesResource.get(this.formState.state.profileId);

    if (!profile) {
      return true;
    }

    return this.aiEnginePropertiesResource.isLoaded(profile.engineId);
  }

  async changeEngine(engineId: string): Promise<void> {
    if (this.formState.mode !== FormMode.Create) {
      return;
    }

    const propertiesInfo = await this.aiEnginePropertiesResource.load(engineId);

    runInAction(() => {
      this.state.engineId = engineId;
      this.state.properties = getObjectPropertiesValues(propertiesInfo ?? []);
      this.state.global = this.state.properties[GLOBAL_PROPERTY_ID] !== false;
      this.state.properties[GLOBAL_PROPERTY_ID] = this.state.global;
      if (!this.aiProfileCredentialsService.isSupported(propertiesInfo ?? [])) {
        this.state.global = true;
      }
    });
  }

  protected override format(): void {
    this.state.name = this.state.name.trim();

    if (this.formState.mode === FormMode.Create) {
      const profileNames = this.aiProfilesResource.values.map(profile => profile.name);
      this.state.name = getUniqueName(this.state.name, profileNames);
    }

    trimObjectValues(this.state.properties);
  }

  protected override validate(_: IFormState<IAIProfileFormState>, contexts: IExecutionContextProvider<IFormState<IAIProfileFormState>>): void {
    const properties = this.aiEnginePropertiesResource.get(this.state.engineId) ?? [];
    if (!this.state.global && !this.aiProfileCredentialsService.isSupported(properties)) {
      contexts.getContext(formValidationContext).error('plugin_ai_administration_profile_user_credentials_unsupported');
    }
  }

  private getConfig(): AIProfileInput {
    this.state.properties[GLOBAL_PROPERTY_ID] = this.state.global;
    return {
      profileId: this.formState.state.profileId,
      profileName: this.state.name,
      engineId: this.state.engineId,
      configuration: {
        properties: prepareProperties({
          engineProperties: this.state.properties,
          initialEngineProperties: this.initialState.properties,
          infoProperties: (this.aiEnginePropertiesResource.get(this.state.engineId) ?? []).filter(
            property => this.state.global || property.id !== 'token',
          ),
        }),
      },
    };
  }

  protected override async saveChanges(): Promise<void> {
    const config = this.getConfig();

    let profile: AIAdminProfile;

    if (this.formState.mode === FormMode.Create) {
      profile = await this.aiProfilesAdministrationService.create(config);
      this.formState.setMode(FormMode.Edit);
    } else {
      profile = await this.aiProfilesAdministrationService.update(config);
    }

    this.formState.state.name = profile.name;

    this.setInitialState({
      name: profile.name,
      engineId: profile.engineId,
      global: profile.global,
      properties: { ...getObjectPropertiesValues(profile.configuration), [GLOBAL_PROPERTY_ID]: profile.global },
    });
  }

  protected override async loader(): Promise<void> {
    if (this.formState.mode !== FormMode.Edit) {
      this.setInitialState(getDefaultState());
      return;
    }

    const profile = await this.aiProfilesResource.load(this.formState.state.profileId);

    if (!profile) {
      this.setInitialState(getDefaultState());
      return;
    }

    await this.aiEnginePropertiesResource.load(profile.engineId);
    const propertiesInfo = await this.aiEnginePropertiesResource.loadProperties(profile.engineId, this.formState.state.profileId);

    this.setInitialState({
      name: profile.name,
      engineId: profile.engineId,
      global: profile.global,
      properties: { ...getObjectPropertiesValues(propertiesInfo), [GLOBAL_PROPERTY_ID]: profile.global },
    });
  }

  getCurrentEngineSettings(): AiEngineConfig {
    this.state.properties[GLOBAL_PROPERTY_ID] = this.state.global;
    return {
      properties: prepareProperties({
        engineProperties: this.state.properties,
        initialEngineProperties: this.initialState.properties,
        infoProperties: this.aiEnginePropertiesResource.get(this.state.engineId) ?? [],
      }),
    };
  }
}
