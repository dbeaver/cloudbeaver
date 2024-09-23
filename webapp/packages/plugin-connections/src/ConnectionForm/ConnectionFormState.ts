/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { action, computed, makeObservable, observable } from 'mobx';

import {
  ConnectionInfoOriginResource,
  ConnectionInfoResource,
  createConnectionParam,
  type DatabaseConnection,
  type IConnectionInfoParams,
} from '@cloudbeaver/core-connections';
import { Executor, type IExecutionContextProvider, type IExecutor } from '@cloudbeaver/core-executor';
import type { ProjectInfoResource, ProjectsService } from '@cloudbeaver/core-projects';
import type { ResourceKeySimple } from '@cloudbeaver/core-resource';
import type { ConnectionConfig } from '@cloudbeaver/core-sdk';
import { formStateContext, type IFormStateInfo } from '@cloudbeaver/core-ui';
import { MetadataMap, uuid } from '@cloudbeaver/core-utils';

import { connectionFormConfigureContext } from './connectionFormConfigureContext.js';
import type { ConnectionFormService } from './ConnectionFormService.js';
import type { ConnectionFormMode, ConnectionFormType, IConnectionFormState, IConnectionFormSubmitData } from './IConnectionFormProps.js';

export class ConnectionFormState implements IConnectionFormState {
  mode: ConnectionFormMode;
  type: ConnectionFormType;
  projectId: string | null;

  config: ConnectionConfig;

  partsState: MetadataMap<string, any>;

  statusMessage: string | string[] | null;
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
    if (!this.config.connectionId || this.projectId === null) {
      return undefined;
    }

    return this.resource.get(createConnectionParam(this.projectId, this.config.connectionId));
  }

  get originInfo() {
    if (!this.config.connectionId || this.projectId === null) {
      return undefined;
    }

    return this.originResource.get(createConnectionParam(this.projectId, this.config.connectionId));
  }

  get readonly(): boolean {
    if (this.stateInfo?.readonly) {
      return true;
    }

    if (this.type === 'admin' || this.mode === 'create') {
      return false;
    }

    if (!this.info?.canEdit) {
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

  readonly resource: ConnectionInfoResource;
  readonly originResource: ConnectionInfoOriginResource;
  readonly service: ConnectionFormService;
  readonly submittingTask: IExecutor<IConnectionFormSubmitData>;
  readonly closeTask: IExecutor;

  private readonly _id: string;
  private stateInfo: IFormStateInfo | null;
  private readonly loadConnectionTask: IExecutor<IConnectionFormState>;
  private readonly formStateTask: IExecutor<IConnectionFormState>;
  private _availableDrivers: string[];

  constructor(
    private readonly projectsService: ProjectsService,
    private readonly projectInfoResource: ProjectInfoResource,
    service: ConnectionFormService,
    resource: ConnectionInfoResource,
    originResource: ConnectionInfoOriginResource,
  ) {
    this._id = uuid();
    this.initError = null;

    this.resource = resource;
    this.originResource = originResource;
    this.projectId = null;
    this.config = {};
    this._availableDrivers = [];
    this.stateInfo = null;
    this.partsState = new MetadataMap();
    this.service = service;
    this.formStateTask = new Executor<IConnectionFormState>(this, () => true);
    this.loadConnectionTask = new Executor<IConnectionFormState>(this, () => true);
    this.submittingTask = new Executor();
    this.closeTask = new Executor();
    this.statusMessage = null;
    this.configured = false;
    this.mode = 'create';
    this.type = 'public';

    this.syncProject = this.syncProject.bind(this);
    this.syncInfo = this.syncInfo.bind(this);
    this.test = this.test.bind(this);
    this.save = this.save.bind(this);
    this.checkFormState = this.checkFormState.bind(this);
    this.loadInfo = this.loadInfo.bind(this);
    this.updateFormState = this.updateFormState.bind(this);

    this.formStateTask.addCollection(service.formStateTask).addPostHandler(this.updateFormState);

    this.resource.onItemUpdate.addHandler(this.syncInfo);

    this.projectInfoResource.onDataUpdate.addHandler(this.syncProject);

    this.projectsService.onActiveProjectChange.addHandler(this.syncProject);

    this.submittingTask.addPostHandler(async (data, contexts) => {
      const status = contexts.getContext(service.connectionStatusContext);
      const validation = contexts.getContext(service.connectionValidationContext);

      if (data.submitType !== 'submit' || !status.saved || !validation.valid) {
        return;
      }

      this.reset();
      await this.load();
    });

    this.loadConnectionTask
      .before(service.configureTask)
      .addPostHandler(this.loadInfo)
      .next(service.fillConfigTask, (state, contexts) => {
        const configuration = contexts.getContext(connectionFormConfigureContext);

        return {
          state,
          updated: state.info !== configuration.info || state.config.driverId !== configuration.driverId || !this.configured,
        };
      })
      .next(this.formStateTask);

    makeObservable<IConnectionFormState, '_availableDrivers' | 'stateInfo' | 'updateFormState'>(this, {
      projectId: observable,
      mode: observable,
      type: observable,
      config: observable,
      availableDrivers: computed,
      _availableDrivers: observable,
      info: computed,
      originInfo: computed,
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
      this.initError = null;
      await this.loadConnectionTask.execute(this);

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

  setOptions(mode: ConnectionFormMode, type: ConnectionFormType): this {
    this.mode = mode;
    this.type = type;
    return this;
  }

  setConfig(projectId: string, config: ConnectionConfig): this {
    this.setProject(projectId);
    this.config = config;
    this.reset();
    return this;
  }

  setProject(projectId: string): this {
    this.projectId = projectId;
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
      this.service.formSubmittingTask,
    );
  }

  async test(): Promise<void> {
    await this.submittingTask.executeScope(
      {
        state: this,
        submitType: 'test',
      },
      this.service.formSubmittingTask,
    );
  }

  async checkFormState(): Promise<IFormStateInfo | null> {
    await this.loadConnectionInfo();
    return this.stateInfo;
  }

  dispose(): void {
    this.resource.onItemUpdate.removeHandler(this.syncInfo);
    this.projectInfoResource.onDataUpdate.removeHandler(this.syncProject);
    this.projectsService.onActiveProjectChange.removeHandler(this.syncProject);
  }

  async close(): Promise<void> {
    await this.closeTask.execute();
  }

  private updateFormState(data: IConnectionFormState, contexts: IExecutionContextProvider<IConnectionFormState>): void {
    const context = contexts.getContext(formStateContext);

    if (this.mode === 'create') {
      context.markEdited();
    }

    this.statusMessage = context.statusMessage;

    if (this.statusMessage === null && this.mode === 'edit') {
      if (!this.info?.canEdit) {
        this.statusMessage = 'connections_connection_edit_not_own_deny';
      }
    }

    this.stateInfo = context;
    this.configured = true;
  }

  private syncInfo(key: ResourceKeySimple<IConnectionInfoParams>) {
    if (
      !this.config.connectionId ||
      this.projectId === null ||
      !this.resource.isIntersect(key, createConnectionParam(this.projectId, this.config.connectionId))
    ) {
      return;
    }

    this.loadConnectionInfo();
  }

  private async syncProject() {
    if (!this.projectId) {
      return;
    }

    const project = this.projectInfoResource.get(this.projectId);
    if (!project?.canEditDataSources || !this.projectsService.activeProjects.includes(project)) {
      await this.close();
    }
  }

  private async loadInfo(data: IConnectionFormState, contexts: IExecutionContextProvider<IConnectionFormState>) {
    if (!data.config.connectionId || data.projectId === null) {
      return;
    }

    const key = createConnectionParam(data.projectId, data.config.connectionId);
    const configuration = contexts.getContext(connectionFormConfigureContext);

    if (!data.resource.has(key)) {
      return;
    }

    await data.resource.load(key, configuration.connectionIncludes);
    await this.originResource.load(key);
  }
}
