/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { IExecutionContextProvider } from '@cloudbeaver/core-executor';
import { formValidationContext, type IFormState } from '@cloudbeaver/core-ui';

import { AIProfilesResource } from '../AIProfilesResource.js';
import { AIProfileCredentialsFormPart } from './AIProfileCredentialsFormPart.js';
import { getAIProfileSubscriptionFormPart } from './getAIProfileCredentialsFormParts.js';
import type { IAIProfileCredentialsFormState } from './IAIProfileCredentialsFormState.js';

const getDefaultState = () => ({ token: '' });

export class AIProfileTokenFormPart extends AIProfileCredentialsFormPart<{ token: string }> {
  constructor(formState: IFormState<IAIProfileCredentialsFormState>, aiProfilesResource: AIProfilesResource) {
    super(formState, getDefaultState(), aiProfilesResource);
  }

  override get accountAuthentication(): boolean {
    return getAIProfileSubscriptionFormPart(this.formState).accountAuthentication;
  }

  override get isChanged(): boolean {
    return super.isChanged && !this.accountAuthentication;
  }

  get credentialsMissing(): boolean {
    return !this.state.token && !this.profile?.tokenSaved;
  }

  async resetCredentials(): Promise<void> {
    if (this.formState.isDisabled) {
      return;
    }
    this.loading = true;
    try {
      await this.aiProfilesResource.resetCredentials(this.formState.state.profileId);
      this.loaded = false;
    } finally {
      this.loading = false;
    }
  }

  protected override async saveChanges(): Promise<void> {
    if (this.accountAuthentication) {
      return;
    }
    await this.aiProfilesResource.saveCredentials(this.formState.state.profileId, this.state.token, false);
  }

  protected override async loader(): Promise<void> {
    await this.aiProfilesResource.load(this.formState.state.profileId);
    this.setInitialState(getDefaultState());
  }

  protected override validate(
    _: IFormState<IAIProfileCredentialsFormState>,
    contexts: IExecutionContextProvider<IFormState<IAIProfileCredentialsFormState>>,
  ): void {
    if (!this.accountAuthentication && this.credentialsMissing) {
      contexts.getContext(formValidationContext).error('plugin_ai_credentials_token_required');
    }
  }
}
