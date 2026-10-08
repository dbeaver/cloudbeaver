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

import { AIProfilesResource } from '../AIProfilesResource.js';
import type { IAIProfileCredentialsFormState } from './IAIProfileCredentialsFormState.js';

const getDefaultState = () => ({ token: '', accountAuthentication: false });

export class AIProfileCredentialsFormPart extends FormPart<ReturnType<typeof getDefaultState>, IAIProfileCredentialsFormState> {
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
    if (!this.aiProfilesResource.get(this.formState.state.profileId)) {
      return false;
    }
    return this.aiEnginesResource.isOutdated();
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
    const profile = this.aiProfilesResource.get(this.formState.state.profileId);
    await this.aiProfilesResource.saveCredentials(
      this.formState.state.profileId,
      this.state.token,
      !!profile?.deviceAuthorizationAvailable && this.state.accountAuthentication,
    );
  }

  protected override validate(
    _: IFormState<IAIProfileCredentialsFormState>,
    contexts: IExecutionContextProvider<IFormState<IAIProfileCredentialsFormState>>,
  ): void {
    const profile = this.aiProfilesResource.get(this.formState.state.profileId);
    if (profile?.deviceAuthorizationAvailable && this.state.accountAuthentication) {
      if (!profile.account) {
        contexts.getContext(formValidationContext).error('plugin_ai_account_not_connected');
      }
    } else if (!this.state.token && !profile?.tokenSaved) {
      contexts.getContext(formValidationContext).error('plugin_ai_credentials_token_required');
    }
  }
}
