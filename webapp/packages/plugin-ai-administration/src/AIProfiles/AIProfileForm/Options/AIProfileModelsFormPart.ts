/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { runInAction } from 'mobx';

import type { AiModelInfo } from '@cloudbeaver/core-sdk';
import { FormMode, FormPart, type IFormState } from '@cloudbeaver/core-ui';

import { CONTEXT_WINDOW_SIZE_PROPERTY_ID, MODEL_PROPERTY_ID, TEMPERATURE_PROPERTY_ID } from '../../AIEnginePropertiesResource.js';
import { AIProfilesResource } from '../../AIProfilesResource.js';
import type { IAIProfileFormState } from '../IAIProfileFormState.js';
import type { AIProfileFormPart } from './AIProfileFormPart.js';
import type { IAIProfileModelsState } from './AIProfileModelsSchema.js';

const getDefaultState = (): IAIProfileModelsState => ({ models: [] });

export class AIProfileModelsFormPart extends FormPart<IAIProfileModelsState, IAIProfileFormState> {
  constructor(
    formState: IFormState<IAIProfileFormState>,
    private readonly aiProfilesResource: AIProfilesResource,
    private readonly profileFormPart: AIProfileFormPart,
  ) {
    super(formState, getDefaultState());
  }

  override isLoaded(): boolean {
    return this.loaded && this.profileFormPart.isLoaded();
  }

  async loadModels(): Promise<void> {
    const engineId = this.profileFormPart.state.engineId;
    if (!engineId) {
      runInAction(() => {
        this.state.models = [];
      });
      return;
    }

    const profileId = this.formState.mode === FormMode.Edit ? this.formState.state.profileId : undefined;
    const models = await this.aiProfilesResource.loadModels(engineId, profileId, this.profileFormPart.getCurrentEngineSettings());

    this.setInitialState({ models });

    const chatModels = models.filter(model => model.features.map(feature => feature.toLowerCase()).includes('chat'));
    const currentModelId = this.profileFormPart.state.properties[MODEL_PROPERTY_ID];

    if (!chatModels.some(model => model.id === currentModelId)) {
      const firstModel = chatModels[0];
      this.applyModelToProfile(firstModel?.id ?? null);
    }
  }

  applyModelToProfile(modelId: string | null): void {
    const model = this.state.models.find(model => model.id === modelId) as AiModelInfo | undefined;
    this.profileFormPart.state.properties[MODEL_PROPERTY_ID] = modelId;

    if (!model) {
      return;
    }

    if (model.contextWindowSize != null) {
      this.profileFormPart.state.properties[CONTEXT_WINDOW_SIZE_PROPERTY_ID] = model.contextWindowSize;
    }

    this.profileFormPart.state.properties[TEMPERATURE_PROPERTY_ID] = model.defaultTemperature;
  }

  protected override async loader(): Promise<void> {
    await this.profileFormPart.load();
    await this.loadModels();
  }

  protected override async saveChanges(): Promise<void> {}
}
