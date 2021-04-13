/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { computed, makeObservable, observable } from 'mobx';

import { ExecutorHandlersCollection, IExecutorHandlersCollection } from '@cloudbeaver/core-executor';
import type { CachedMapResource, ConnectionConfig, GetConnectionsQueryVariables } from '@cloudbeaver/core-sdk';
import { MetadataMap } from '@cloudbeaver/core-utils';

import type { DatabaseConnection } from '../Administration/ConnectionsResource';
import { EConnectionFeature } from '../EConnectionFeature';
import type { IConnectionFormState, IConnectionFormSubmitData, ConnectionFormMode, ConnectionFormType, ConnectionFormService } from './ConnectionFormService';
import { connectionFormStateContext, IConnectionFormStateContext } from './connectionFormStateContext';

export class ConnectionFormState implements IConnectionFormState {
  mode: ConnectionFormMode;
  type: ConnectionFormType;

  config: ConnectionConfig;

  partsState: MetadataMap<string, any>;

  disabled: boolean;
  loading: boolean;

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
    if (this.type === 'admin' || this.mode === 'create') {
      return false;
    }

    if (this.info?.features && !this.info.features.includes(EConnectionFeature.manageable)) {
      return true;
    }

    return false;
  }

  readonly resource: CachedMapResource<string, DatabaseConnection, GetConnectionsQueryVariables>;
  readonly service: ConnectionFormService;
  readonly submittingHandlers: IExecutorHandlersCollection<IConnectionFormSubmitData>;

  private _availableDrivers: string[];

  constructor(
    service: ConnectionFormService,
    resource: CachedMapResource<string, DatabaseConnection, GetConnectionsQueryVariables>
  ) {
    makeObservable<IConnectionFormState, '_availableDrivers'>(this, {
      mode: observable,
      type: observable,
      config: observable,
      availableDrivers: computed,
      _availableDrivers: observable,
      info: computed,
      disabled: observable,
      loading: observable,
      readonly: computed,
    });

    this.resource = resource;
    this.config = {};
    this._availableDrivers = [];
    this.partsState = new MetadataMap();
    this.service = service;
    this.submittingHandlers = new ExecutorHandlersCollection();
    this.disabled = false;
    this.loading = false;
    this.mode = 'create';
    this.type = 'public';

    this.submittingHandlers
      .addHandler(() => {
        this.loading = true;
        this.disabled = true;
      })
      .addPostHandler(() => {
        this.loading = false;
        this.disabled = false;
      });

    this.test = this.test.bind(this);
    this.save = this.save.bind(this);
    this.checkFormState = this.checkFormState.bind(this);
  }

  reset(): void {
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
    await this.service.formSubmittingTask.executeScope(
      {
        state: this,
        submitType: 'submit',
      },
      this.submittingHandlers
    );
  }

  async test(): Promise<void> {
    await this.service.formSubmittingTask.executeScope(
      {
        state: this,
        submitType: 'test',
      },
      this.submittingHandlers
    );
  }

  async checkFormState(): Promise<IConnectionFormStateContext> {
    if (this.mode === 'create') {
      const context = connectionFormStateContext();
      context.markEdited();
      return context;
    }

    const contexts = await this.service.formStateTask.execute(this);

    return contexts.getContext(connectionFormStateContext);
  }
}
