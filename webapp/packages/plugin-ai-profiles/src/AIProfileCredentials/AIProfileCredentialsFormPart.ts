/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Executor, type IExecutionContextProvider } from '@cloudbeaver/core-executor';
import { FormPart, formValidationContext, type IFormState } from '@cloudbeaver/core-ui';
import { AiEnginesResource, type EngineInfo } from '@cloudbeaver/plugin-ai';

import { AIProfilesResource, type AIProfile } from '../AIProfilesResource.js';
import type { IAIProfileCredentialsFormState } from './IAIProfileCredentialsFormState.js';

const getDefaultState = () => ({ token: '', accountAuthentication: false });

export class AIProfileCredentialsFormPart extends FormPart<ReturnType<typeof getDefaultState>, IAIProfileCredentialsFormState> {
  readonly onBeforeLeave = new Executor();

  constructor(
    formState: IFormState<IAIProfileCredentialsFormState>,
    private readonly aiProfilesResource: AIProfilesResource,
    private readonly aiEnginesResource: AiEnginesResource,
  ) {
    super(formState, getDefaultState());
  }

  get currentProfile(): AIProfile | undefined {
    return this.aiProfilesResource.get(this.formState.state.profileId);
  }

  get currentEngine(): EngineInfo | undefined {
    return this.aiEnginesResource.data.find(engine => engine.id === this.currentProfile?.engineId);
  }

  get accountAuthentication(): boolean {
    return !!this.currentProfile?.deviceAuthorizationAvailable && this.state.accountAuthentication;
  }

  override isOutdated(): boolean {
    if (this.aiProfilesResource.isOutdated(this.formState.state.profileId)) {
      return true;
    }
    if (!this.currentProfile) {
      return false;
    }
    return this.aiEnginesResource.isOutdated();
  }

  async resetCredentials(): Promise<void> {
    this.loading = true;
    try {
      await this.aiProfilesResource.resetCredentials(this.formState.state.profileId);
      this.loaded = false;
    } finally {
      this.loading = false;
    }
  }

  protected override async loader(): Promise<void> {
    const profile = await this.aiProfilesResource.load(this.formState.state.profileId);
    if (!profile) {
      this.setInitialState(getDefaultState());
      return;
    }
    await this.aiEnginesResource.load();
    this.setInitialState({ token: '', accountAuthentication: profile.deviceAuthorizationAvailable && profile.accountAuthentication });
  }

  protected override async saveChanges(): Promise<void> {
    await this.aiProfilesResource.saveCredentials(this.formState.state.profileId, this.state.token, this.accountAuthentication);
  }

  protected override validate(
    _: IFormState<IAIProfileCredentialsFormState>,
    contexts: IExecutionContextProvider<IFormState<IAIProfileCredentialsFormState>>,
  ): void {
    if (this.accountAuthentication) {
      if (!this.currentProfile?.account) {
        contexts.getContext(formValidationContext).error('plugin_ai_account_not_connected');
      }
    } else if (!this.state.token && !this.currentProfile?.tokenSaved) {
      contexts.getContext(formValidationContext).error('plugin_ai_credentials_token_required');
    }
  }
}
