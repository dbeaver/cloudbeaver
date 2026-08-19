/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { makeObservable, observable, runInAction } from 'mobx';

import type { AiModelInfo, IObjectPropertyInfo } from '@cloudbeaver/core-sdk';
import { FormMode, FormPart, type IFormState } from '@cloudbeaver/core-ui';
import { getUniqueName } from '@cloudbeaver/core-utils';

import {
  AIEnginePropertiesResource,
  CONTEXT_WINDOW_SIZE_PROPERTY_ID,
  MODEL_PROPERTY_ID,
  TEMPERATURE_PROPERTY_ID,
} from '../../AIEnginePropertiesResource.js';
import { AIModelsService } from '../../AIModelsService.js';
import { type AIAdminProfile, type AIProfileInput, AIProfilesResource } from '../../AIProfilesResource.js';
import { getObjectPropertiesValues } from '../../utils/getObjectPropertiesValues.js';
import { prepareProperties } from '../../utils/prepareProperties.js';
import type { IAIProfileFormState } from '../IAIProfileFormState.js';
import type { IAIProfileOptionsState } from './AIProfileSchema.js';

const getDefaultState = (): IAIProfileOptionsState => ({
  name: '',
  engineId: '',
  properties: {},
});

export class AIProfileFormPart extends FormPart<IAIProfileOptionsState, IAIProfileFormState> {
  // Property metadata may depend on profile credentials, so keep dynamic model values local to the form.
  propertiesInfo: IObjectPropertyInfo[] = [];
  models: AiModelInfo[] = [];

  constructor(
    formState: IFormState<IAIProfileFormState>,
    private readonly aiProfilesResource: AIProfilesResource,
    private readonly aiEnginePropertiesResource: AIEnginePropertiesResource,
    private readonly aiModelsService: AIModelsService,
  ) {
    super(formState, getDefaultState());

    makeObservable(this, {
      propertiesInfo: observable.ref,
      models: observable.ref,
    });
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
      this.propertiesInfo = propertiesInfo ?? [];
      this.models = [];
    });
  }

  selectModel(modelId: string | null): void {
    this.state.properties[MODEL_PROPERTY_ID] = modelId;

    const model = this.models.find(model => model.id === modelId);
    if (!model) {
      return;
    }
    if (model.contextWindowSize != null) {
      this.state.properties[CONTEXT_WINDOW_SIZE_PROPERTY_ID] = model.contextWindowSize;
    }
    this.state.properties[TEMPERATURE_PROPERTY_ID] = model.defaultTemperature;
  }

  async refreshModels(): Promise<void> {
    if (!this.state.engineId) {
      return;
    }

    const profileId = this.formState.mode === FormMode.Edit ? this.formState.state.profileId : undefined;
    const models = await this.aiModelsService.load(this.state.engineId, profileId, this.getCurrentEngineSettings());

    runInAction(() => {
      this.models = models;
    });
  }

  protected override format(): void {
    this.state.name = this.state.name.trim();

    if (this.formState.mode === FormMode.Create) {
      const profileNames = this.aiProfilesResource.values.map(profile => profile.name);
      this.state.name = getUniqueName(this.state.name, profileNames);
    }

    for (const key of Object.keys(this.state.properties)) {
      const value = this.state.properties[key];

      if (typeof value === 'string') {
        this.state.properties[key] = value.trim();
      }
    }
  }

  private getConfig(): AIProfileInput {
    return {
      profileId: this.formState.state.profileId,
      profileName: this.state.name,
      engineId: this.state.engineId,
      configuration: {
        properties: prepareProperties({
          engineProperties: this.state.properties,
          initialEngineProperties: this.initialState.properties,
          infoProperties: this.propertiesInfo,
        }),
      },
    };
  }

  protected override async saveChanges(): Promise<void> {
    const config = this.getConfig();

    let profile: AIAdminProfile;

    if (this.formState.mode === FormMode.Create) {
      profile = await this.aiProfilesResource.create(config);
      this.formState.setMode(FormMode.Edit);
    } else {
      profile = await this.aiProfilesResource.update(config);
    }

    this.formState.state.name = profile.name;

    this.setInitialState({
      name: profile.name,
      engineId: profile.engineId,
      properties: getObjectPropertiesValues(profile.configuration),
    });
  }

  protected override async loader(): Promise<void> {
    if (this.formState.mode !== FormMode.Edit) {
      runInAction(() => {
        this.propertiesInfo = [];
        this.models = [];
        this.setInitialState(getDefaultState());
      });
      return;
    }

    const profile = await this.aiProfilesResource.load(this.formState.state.profileId);

    if (!profile) {
      runInAction(() => {
        this.propertiesInfo = [];
        this.models = [];
        this.setInitialState(getDefaultState());
      });
      return;
    }

    await this.aiEnginePropertiesResource.load(profile.engineId);
    const propertiesInfo = await this.aiEnginePropertiesResource.loadProperties(profile.engineId, this.formState.state.profileId);

    runInAction(() => {
      this.propertiesInfo = propertiesInfo;
      this.models = [];
      this.setInitialState({
        name: profile.name,
        engineId: profile.engineId,
        properties: getObjectPropertiesValues(propertiesInfo),
      });
    });
  }

  private getCurrentEngineSettings() {
    return {
      properties: prepareProperties({
        engineProperties: this.state.properties,
        initialEngineProperties: this.initialState.properties,
        infoProperties: this.propertiesInfo,
      }),
    };
  }
}
