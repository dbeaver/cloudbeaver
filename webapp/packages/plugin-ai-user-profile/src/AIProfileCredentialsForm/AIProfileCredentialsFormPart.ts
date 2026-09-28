/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { IExecutionContextProvider } from '@cloudbeaver/core-executor';
import { FormPart, formValidationContext, type IFormState } from '@cloudbeaver/core-ui';
import { AiEnginesResource } from '@cloudbeaver/plugin-ai';
import { AIProfilesResource, type IAIProfileCredentialsState } from '@cloudbeaver/plugin-ai-profiles';

import type { IAIProfileCredentialsFormState } from './IAIProfileCredentialsFormState.js';

export interface IAIProfileCredentialsPartState extends IAIProfileCredentialsState {
  profileName: string;
  engineName: string;
}

const getDefaultState = (): IAIProfileCredentialsPartState => ({
  profileName: '',
  engineName: '',
  token: '',
  accountAuthentication: false,
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

  credentialsChanged(accountAuthentication: boolean): void {
    this.setInitialState({ ...this.initialState, token: '', accountAuthentication });
    this.reset();
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
      accountAuthentication: profile.accountAuthentication,
    });
  }

  protected override async saveChanges(): Promise<void> {
    await this.aiProfilesResource.saveCredentials(this.formState.state.profileId, this.state.token, this.state.accountAuthentication);
    this.credentialsChanged(this.state.accountAuthentication);
  }

  protected override validate(
    _: IFormState<IAIProfileCredentialsFormState>,
    contexts: IExecutionContextProvider<IFormState<IAIProfileCredentialsFormState>>,
  ): void {
    const profile = this.aiProfilesResource.get(this.formState.state.profileId);
    const validation = contexts.getContext(formValidationContext);
    if (this.state.accountAuthentication) {
      if (!profile?.accountProvider || !profile.account) {
        validation.error('plugin_ai_account_not_connected');
      }
    } else if (!this.state.token && !profile?.tokenSaved) {
      validation.error('plugin_ai_credentials_token_required');
    }
  }
}
