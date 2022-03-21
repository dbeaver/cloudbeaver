/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { action, computed, makeObservable, observable } from 'mobx';

import type { IFormStateInfo } from '@cloudbeaver/core-blocks';
import { DatabaseConnection, EConnectionFeature, IConnectionsResource } from '@cloudbeaver/core-connections';
import { Executor, IExecutionContextProvider, IExecutor } from '@cloudbeaver/core-executor';
import { ConnectionConfig, ResourceKey, ResourceKeyUtils } from '@cloudbeaver/core-sdk';
import { MetadataMap, uuid } from '@cloudbeaver/core-utils';

import { connectionFormConfigureContext } from './connectionFormConfigureContext';
import type { ConnectionFormService } from './ConnectionFormService';
import { connectionFormStateContext } from './Contexts/connectionFormStateContext';
import type { IConnectionFormState, ConnectionFormMode, ConnectionFormType, IConnectionFormSubmitData } from './IConnectionFormProps';

export class ConnectionFormState implements IConnectionFormState {
  mode: ConnectionFormMode;
  type: ConnectionFormType;

  config: ConnectionConfig;

  partsState: MetadataMap<string, any>;

  statusMessage: string | null;
  configured: boolean;
  initError: Error | null;

  get loading(): boolean {
    return this.loadConnectionTask.executing || this.submittingTask.executing;
  }

  get disabled(): boolean {
    return this.loading || !!this.stateInfo?.disabled || this.loadConnectionTask.executing;
  }

  get availableDrivers(): string[] {
    if (this._availableDrivers.length === 0 && this.config.driverId) {
      return [this.config.driverId];
    }

    return this._availableDrivers;
  }

  get info(): DatabaseConnection | undefined {
    if (!this.config.connectionId) {
      return undefined;
    }

    return this.resource.get(this.config.connectionId);
  }

  get readonly(): boolean {
    if (this.stateInfo?.readonly) {
      return true;
    }

    if (this.type === 'admin' || this.mode === 'create') {
      return false;
    }

    if (!this.info?.features.includes(EConnectionFeature.manageable)) {
      return true;
    }

    return false;
  }

  get id(): string {
    if (this.mode === 'create') {
      return 'create';
    }

    return this.config.connectionId || this._id;
  }

  readonly resource: IConnectionsResource;
  readonly service: ConnectionFormService;
  readonly submittingTask: IExecutor<IConnectionFormSubmitData>;

  private readonly _id: string;
  private stateInfo: IFormStateInfo | null;
  private readonly loadConnectionTask: IExecutor<IConnectionFormState>;
  private readonly formStateTask: IExecutor<IConnectionFormState>;
  private _availableDrivers: string[];

  constructor(
    service: ConnectionFormService,
    resource: IConnectionsResource
  ) {
    this._id = uuid();
    this.initError = null;

    this.resource = resource;
    this.config = {};
    this._availableDrivers = [];
    this.stateInfo = null;
    this.partsState = new MetadataMap();
    this.service = service;
    this.formStateTask = new Executor<IConnectionFormState>(this, () => true);
    this.loadConnectionTask = new Executor<IConnectionFormState>(this, () => true);
    this.submittingTask = new Executor();
    this.statusMessage = null;
    this.configured = false;
    this.mode = 'create';
    this.type = 'public';

    this.syncInfo = this.syncInfo.bind(this);
    this.test = this.test.bind(this);
    this.save = this.save.bind(this);
    this.checkFormState = this.checkFormState.bind(this);
    this.loadInfo = this.loadInfo.bind(this);
    this.updateFormState = this.updateFormState.bind(this);

    this.formStateTask
      .addCollection(service.formStateTask)
      .addPostHandler(this.updateFormState);

    this.resource.onItemAdd
      .addHandler(this.syncInfo);

    this.loadConnectionTask
      .before(service.configureTask)
      .addPostHandler(this.loadInfo)
      .next(service.fillConfigTask, (state, contexts) => {
        const configuration = contexts.getContext(connectionFormConfigureContext);

        return {
          state,
          updated: state.info !== configuration.info
            || state.config.driverId !== configuration.driverId
            || !this.configured,
        };
      })
      .next(this.formStateTask);

    makeObservable<IConnectionFormState, '_availableDrivers' | 'stateInfo' | 'updateFormState'>(this, {
      mode: observable,
      type: observable,
      config: observable,
      availableDrivers: computed,
      _availableDrivers: observable,
      info: computed,
      statusMessage: observable,
      configured: observable,
      readonly: computed,
      stateInfo: observable,
      initError: observable.ref,
      id: computed,
      reset: action,
      setOptions: action,
      setConfig: action,
      setAvailableDrivers: action,
      updateFormState: action,
    });
  }

  async loadConnectionInfo(): Promise<DatabaseConnection | undefined> {
    try {
      await this.loadConnectionTask.execute(this);
      this.initError = null;

      return this.info;
    } catch (exception: any) {
      this.initError = exception;
      throw exception;
    }
  }

  async load(): Promise<void> {
    await this.loadConnectionInfo();
  }

  reset(): void {
    this.configured = false;
    this.partsState.clear();
  }

  setPartsState(state: MetadataMap<string, any>): this {
    this.partsState = state;
    return this;
  }

  setOptions(
    mode: ConnectionFormMode,
    type: ConnectionFormType
  ): this {
    this.mode = mode;
    this.type = type;
    return this;
  }

  setConfig(config: ConnectionConfig): this {
    this.config = config;
    this.reset();
    return this;
  }

  setAvailableDrivers(drivers: string[]): this {
    this._availableDrivers = drivers;
    this.reset();
    return this;
  }

  async save(): Promise<void> {
    await this.submittingTask.executeScope(
      {
        state: this,
        submitType: 'submit',
      },
      this.service.formSubmittingTask
    );
  }

  async test(): Promise<void> {
    await this.submittingTask.executeScope(
      {
        state: this,
        submitType: 'test',
      },
      this.service.formSubmittingTask
    );
  }

  async checkFormState(): Promise<IFormStateInfo | null> {
    await this.loadConnectionInfo();
    return this.stateInfo;
  }

  dispose(): void {
    this.resource.onItemAdd
      .removeHandler(this.syncInfo);
  }

  private updateFormState(data: IConnectionFormState, contexts: IExecutionContextProvider<IConnectionFormState>): void {
    const context = contexts.getContext(connectionFormStateContext);

    if (this.mode === 'create') {
      context.markEdited();
    }

    this.statusMessage = context.statusMessage;

    if (this.statusMessage === null && this.mode === 'edit') {
      if (!this.info?.features.includes(EConnectionFeature.manageable)) {
        this.statusMessage = 'connections_connection_edit_not_own_deny';
      }
    }

    this.stateInfo = context;
    this.configured = true;
  }

  private syncInfo(key: ResourceKey<string>) {
    if (!ResourceKeyUtils.includes(key, this.config.connectionId)) {
      return;
    }

    this.loadConnectionInfo();
  }

  private async loadInfo(data: IConnectionFormState, contexts: IExecutionContextProvider<IConnectionFormState>) {
    if (!data.config.connectionId) {
      return;
    }

    const configuration = contexts.getContext(connectionFormConfigureContext);

    if (!this.resource.has(data.config.connectionId)) {
      return;
    }

    await this.resource.load(data.config.connectionId, configuration.connectionIncludes);
  }
}
