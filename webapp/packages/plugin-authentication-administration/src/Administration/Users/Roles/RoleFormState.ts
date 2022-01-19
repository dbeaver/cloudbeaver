/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { computed, makeObservable, observable } from 'mobx';

import type { RoleInfo } from '@cloudbeaver/core-authentication';
import { Executor, IExecutionContextProvider, IExecutor } from '@cloudbeaver/core-executor';
import type { CachedMapResource } from '@cloudbeaver/core-sdk';
import { MetadataMap } from '@cloudbeaver/core-utils';

import { roleFormConfigureContext } from './Contexts/roleFormConfigureContext';
import { IRoleFormStateInfo, roleFormStateContext } from './Contexts/roleFormStateContext';
import type { IRoleFormState, IRoleFormSubmitData, RoleFormMode } from './IRoleFormProps';
import type { RoleFormService } from './RoleFormService';

export class RoleFormState implements IRoleFormState {
  mode: RoleFormMode;
  config: RoleInfo;
  statusMessage: string | null;
  configured: boolean;
  partsState: MetadataMap<string, any>;

  get info(): RoleInfo | undefined {
    if (!this.config.roleId) {
      return undefined;
    }
    return this.resource.get(this.config.roleId);
  }

  get loading(): boolean {
    return this.loadRoleTask.executing || this.submittingTask.executing;
  }

  get disabled(): boolean {
    return this.loading || !!this.stateInfo?.disabled || this.loadRoleTask.executing;
  }

  get readonly(): boolean {
    return false;
  }

  readonly resource: CachedMapResource<string, RoleInfo>;

  readonly service: RoleFormService;
  readonly submittingTask: IExecutor<IRoleFormSubmitData>;

  private stateInfo: IRoleFormStateInfo | null;
  private loadRoleTask: IExecutor<IRoleFormState>;
  private formStateTask: IExecutor<IRoleFormState>;

  constructor(
    service: RoleFormService,
    resource: CachedMapResource<string, RoleInfo>
  ) {
    this.resource = resource;
    this.config = {
      roleId: '',
    };

    this.stateInfo = null;
    this.service = service;
    this.formStateTask = new Executor<IRoleFormState>(this, () => true);
    this.loadRoleTask = new Executor<IRoleFormState>(this, () => true);
    this.submittingTask = new Executor();
    this.statusMessage = null;
    this.configured = false;
    this.partsState = new MetadataMap();
    this.mode = 'create';

    makeObservable<IRoleFormState>(this, {
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

    this.loadRoleTask
      .before(service.configureTask)
      .addPostHandler(this.loadInfo)
      .next(service.fillConfigTask, (state, contexts) => {
        const configuration = contexts.getContext(roleFormConfigureContext);

        return {
          state,
          updated: state.info !== configuration.info || !this.configured,
        };
      })
      .next(this.formStateTask);
  }

  async load(): Promise<void> { }

  async loadRoleInfo(): Promise<RoleInfo | undefined> {
    await this.loadRoleTask.execute(this);

    return this.info;
  }

  setOptions(
    mode: RoleFormMode,
  ): this {
    this.mode = mode;
    return this;
  }

  setConfig(config: RoleInfo): this {
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
    data: IRoleFormState,
    contexts: IExecutionContextProvider<IRoleFormState>
  ): void {
    const context = contexts.getContext(roleFormStateContext);

    this.statusMessage = context.statusMessage;

    this.stateInfo = context;
    this.configured = true;
  }

  private async loadInfo(
    data: IRoleFormState,
    contexts: IExecutionContextProvider<IRoleFormState>
  ) {
    if (!data.config.roleId) {
      return;
    }

    if (!this.resource.has(data.config.roleId)) {
      return;
    }

    await this.resource.load(data.config.roleId);
  }
}
