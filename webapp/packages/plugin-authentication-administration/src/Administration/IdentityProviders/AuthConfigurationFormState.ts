/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { computed, makeObservable, observable } from 'mobx';

import { Executor, IExecutionContextProvider, IExecutor } from '@cloudbeaver/core-executor';
import type { AdminAuthProviderConfiguration, CachedMapResource, GetAuthProviderConfigurationsQueryVariables } from '@cloudbeaver/core-sdk';

import type { AuthConfigurationFormService } from './AuthConfigurationFormService';
import { authConfigurationFormConfigureContext } from './Contexts/authConfigurationFormConfigureContext';
import { authConfigurationFormStateContext, IAuthConfigurationFormStateInfo } from './Contexts/authConfigurationFormStateContext';
import type { AuthConfigurationFormMode, IAuthConfigurationFormState, IAuthConfigurationFormSubmitData } from './IAuthConfigurationFormProps';

export class AuthConfigurationFormState implements IAuthConfigurationFormState {
  mode: AuthConfigurationFormMode;
  config: AdminAuthProviderConfiguration;
  statusMessage: string | null;
  configured: boolean;

  get info(): AdminAuthProviderConfiguration | undefined {
    if (!this.config.id) {
      return undefined;
    }

    return this.resource.get(this.config.id);
  }

  get loading(): boolean {
    return this.loadConfigurationTask.executing || this.submittingTask.executing;
  }

  get disabled(): boolean {
    return this.loading || !!this.stateInfo?.disabled || this.loadConfigurationTask.executing;
  }

  get readonly(): boolean {
    return false;
  }

  readonly resource: CachedMapResource<
    string,
    AdminAuthProviderConfiguration,
    GetAuthProviderConfigurationsQueryVariables
  >;

  readonly service: AuthConfigurationFormService;
  readonly submittingTask: IExecutor<IAuthConfigurationFormSubmitData>;

  private stateInfo: IAuthConfigurationFormStateInfo | null;
  private loadConfigurationTask: IExecutor<IAuthConfigurationFormState>;
  private formStateTask: IExecutor<IAuthConfigurationFormState>;

  constructor(
    service: AuthConfigurationFormService,
    resource: CachedMapResource<string, AdminAuthProviderConfiguration, GetAuthProviderConfigurationsQueryVariables>
  ) {
    this.resource = resource;
    this.config = {
      displayName: '',
      id: '',
      disabled: false,
      parameters: {},
      providerId: '',
      description: '',
      iconURL: '',
    };

    this.stateInfo = null;
    this.service = service;
    this.formStateTask = new Executor<IAuthConfigurationFormState>(this, () => true);
    this.loadConfigurationTask = new Executor<IAuthConfigurationFormState>(this, () => true);
    this.submittingTask = new Executor();
    this.statusMessage = null;
    this.configured = false;
    this.mode = 'create';

    makeObservable<IAuthConfigurationFormState>(this, {
      mode: observable,
      config: observable,
      statusMessage: observable,
      info: computed,
      readonly: computed,
    });

    this.save = this.save.bind(this);
    this.loadInfo = this.loadInfo.bind(this);
    this.updateFormState = this.updateFormState.bind(this);

    this.formStateTask
      .addCollection(service.formStateTask)
      .addPostHandler(this.updateFormState);

    this.loadConfigurationTask
      .before(service.configureTask)
      .addPostHandler(this.loadInfo)
      .next(service.fillConfigTask, (state, contexts) => {
        const configuration = contexts.getContext(authConfigurationFormConfigureContext);

        return {
          state,
          updated: state.info !== configuration.info
            || state.config.providerId !== configuration.providerId
            || !this.configured,
        };
      })
      .next(this.formStateTask);
  }

  async load(): Promise<void> { }

  async loadConfigurationInfo(): Promise<AdminAuthProviderConfiguration | undefined> {
    await this.loadConfigurationTask.execute(this);

    return this.info;
  }

  setOptions(
    mode: AuthConfigurationFormMode,
  ): this {
    this.mode = mode;
    return this;
  }

  setConfig(config: AdminAuthProviderConfiguration): this {
    this.config = config;
    return this;
  }

  async save(): Promise<void> {
    await this.submittingTask.executeScope(
      {
        state: this,
      },
      this.service.formSubmittingTask
    );
  }

  private updateFormState(
    data: IAuthConfigurationFormState,
    contexts: IExecutionContextProvider<IAuthConfigurationFormState>
  ): void {
    const context = contexts.getContext(authConfigurationFormStateContext);

    this.statusMessage = context.statusMessage;

    this.stateInfo = context;
    this.configured = true;
  }

  private async loadInfo(
    data: IAuthConfigurationFormState,
    contexts: IExecutionContextProvider<IAuthConfigurationFormState>
  ) {
    if (!data.config.id) {
      return;
    }

    if (!this.resource.has(data.config.id)) {
      return;
    }

    await this.resource.load(data.config.id);
  }
}
