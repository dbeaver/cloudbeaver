/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { makeObservable, observable } from 'mobx';

import type { IExecutionContextProvider, ITask } from '@cloudbeaver/core-executor';
import type { AiDeviceAuthorizationInfo } from '@cloudbeaver/core-sdk';
import { formValidationContext, type IFormState } from '@cloudbeaver/core-ui';

import { AIProfilesResource } from '../AIProfilesResource.js';
import { AIProfileCredentialsFormPart } from './AIProfileCredentialsFormPart.js';
import { AIProfileCredentialsService } from './AIProfileCredentialsService.js';
import type { IAIProfileCredentialsFormState } from './IAIProfileCredentialsFormState.js';

const getDefaultState = () => ({ accountAuthentication: false });

export class AIProfileSubscriptionFormPart extends AIProfileCredentialsFormPart<{ accountAuthentication: boolean }> {
  authorization: AiDeviceAuthorizationInfo | null = null;
  private task: ITask<boolean> | null = null;

  constructor(
    formState: IFormState<IAIProfileCredentialsFormState>,
    aiProfilesResource: AIProfilesResource,
    private readonly aiProfileCredentialsService: AIProfileCredentialsService,
  ) {
    super(formState, getDefaultState(), aiProfilesResource);
    makeObservable(this, { authorization: observable.ref });
  }

  override get accountAuthentication(): boolean {
    return !!this.profile?.deviceAuthorizationAvailable && this.state.accountAuthentication;
  }

  get credentialsMissing(): boolean {
    return !this.profile?.account;
  }

  async connect(): Promise<boolean> {
    if (this.formState.isDisabled || !this.profile?.deviceAuthorizationAvailable) {
      return false;
    }
    this.loading = true;
    this.exception = null;
    this.task = null;
    try {
      const { authorization, task } = this.aiProfileCredentialsService.authorize(this.formState.state.profileId);
      this.task = task;
      const [, connected] = await Promise.all([
        authorization.then(info => {
          if (!task.cancelled) {
            this.authorization = info;
          }
        }),
        task,
      ]);
      if (!connected || task.cancelled) {
        return false;
      }
      this.loaded = false;
      return true;
    } catch (exception: any) {
      if (!this.task?.cancelled) {
        this.exception = exception;
      }
      return false;
    } finally {
      this.authorization = null;
      this.loading = false;
    }
  }

  async disconnect(): Promise<void> {
    if (this.formState.isDisabled) {
      return;
    }
    this.loading = true;
    try {
      await this.aiProfilesResource.disconnectAccount(this.formState.state.profileId);
      this.loaded = false;
    } finally {
      this.loading = false;
    }
  }

  async cancelAuthorization(): Promise<void> {
    if (this.task?.executing) {
      await this.task.cancel();
    }
  }

  override dispose(): Promise<void> {
    return this.cancelAuthorization();
  }

  protected override async saveChanges(): Promise<void> {
    await this.aiProfilesResource.saveCredentials(this.formState.state.profileId, '', this.accountAuthentication);
  }

  protected override async loader(): Promise<void> {
    const profile = await this.aiProfilesResource.load(this.formState.state.profileId);

    if (!profile) {
      this.setInitialState(getDefaultState());
      return;
    }

    this.setInitialState({ accountAuthentication: profile.deviceAuthorizationAvailable && profile.accountAuthentication });
  }

  protected override validate(
    _: IFormState<IAIProfileCredentialsFormState>,
    contexts: IExecutionContextProvider<IFormState<IAIProfileCredentialsFormState>>,
  ): void {
    if (this.accountAuthentication && this.credentialsMissing) {
      contexts.getContext(formValidationContext).error('plugin_ai_account_not_connected');
    }
  }
}
