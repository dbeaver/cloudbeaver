/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { runInAction } from 'mobx';

import { SAVED_VALUE_INDICATOR } from '@cloudbeaver/core-blocks';
import { FormMode, FormPart, type IFormState } from '@cloudbeaver/core-ui';
import { getUniqueName } from '@cloudbeaver/core-utils';

import { AIEnginePropertiesResource, MODEL_PROPERTY_ID } from '../../AIEnginePropertiesResource.js';
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
  constructor(
    formState: IFormState<IAIProfileFormState>,
    private readonly aiProfilesResource: AIProfilesResource,
    private readonly aiEnginePropertiesResource: AIEnginePropertiesResource,
  ) {
    super(formState, getDefaultState());
  }

  get isActiveModelChanged(): boolean {
    return this.state.properties[MODEL_PROPERTY_ID] !== this.initialState.properties[MODEL_PROPERTY_ID];
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
    });
  }

  async loadEngineProperties(): Promise<void> {
    if (!this.state.engineId) {
      return;
    }

    const profileId = this.formState.mode === FormMode.Edit ? this.formState.state.profileId : undefined;
    const currentProperties = this.state.properties;

    const propertiesInfo = await this.aiEnginePropertiesResource.loadProperties(this.state.engineId, profileId, {
      properties: prepareProperties({
        engineProperties: this.state.properties,
        initialEngineProperties: this.initialState.properties,
        infoProperties: this.aiEnginePropertiesResource.get(this.state.engineId) ?? [],
      }),
    });

    runInAction(() => {
      const properties = getObjectPropertiesValues(propertiesInfo);

      for (const property of propertiesInfo) {
        if (!property.id || !property.features.includes('password')) {
          continue;
        }

        const current = currentProperties[property.id];

        if (properties[property.id] === SAVED_VALUE_INDICATOR && current && current !== SAVED_VALUE_INDICATOR) {
          properties[property.id] = current;
        }
      }

      this.state.properties = properties;
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
          infoProperties: this.aiEnginePropertiesResource.get(this.state.engineId) ?? [],
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
      properties: getObjectPropertiesValues(propertiesInfo),
    });
  }
}
