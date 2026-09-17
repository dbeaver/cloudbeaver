/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { FormPart, type IFormState } from '@cloudbeaver/core-ui';
import { AiEnginesResource } from '@cloudbeaver/plugin-ai';
import { AIProfilesResource } from '@cloudbeaver/plugin-ai-profiles';

import type { IAIProfileCredentialsFormState } from './IAIProfileCredentialsFormState.js';

export interface IAIProfileCredentialsPartState {
  profileName: string;
  engineName: string;
  token: string;
}

const getDefaultState = (): IAIProfileCredentialsPartState => ({
  profileName: '',
  engineName: '',
  token: '',
});

export class AIProfileCredentialsFormPart extends FormPart<IAIProfileCredentialsPartState, IAIProfileCredentialsFormState> {
  constructor(
    formState: IFormState<IAIProfileCredentialsFormState>,
    private readonly aiProfilesResource: AIProfilesResource,
    private readonly aiEnginesResource: AiEnginesResource,
  ) {
    super(formState, getDefaultState());
  }

  override isOutdated(): boolean {
    if (this.aiProfilesResource.isOutdated(this.formState.state.profileId)) {
      return true;
    }

    const profile = this.aiProfilesResource.get(this.formState.state.profileId);

    if (!profile) {
      return false;
    }

    return this.aiEnginesResource.isOutdated();
  }

  get credentialsSaved(): boolean {
    return this.aiProfilesResource.get(this.formState.state.profileId)?.credentialsSaved ?? false;
  }

  protected override async loader(): Promise<void> {
    const [profile] = await Promise.all([this.aiProfilesResource.load(this.formState.state.profileId), this.aiEnginesResource.load()]);

    if (!profile) {
      throw new Error('plugin_ai_credentials_profile_not_found');
    }

    const engine = this.aiEnginesResource.data.find(engine => engine.id === profile.engineId);
    this.setInitialState({
      profileName: profile.name,
      engineName: engine?.name ?? profile.engineId,
      token: '',
    });
  }

  protected override async saveChanges(): Promise<void> {
    await this.aiProfilesResource.saveCredentials(this.formState.state.profileId, this.state.token);
  }
}
