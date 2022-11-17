/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { action, computed, makeObservable, observable, runInAction, toJS } from 'mobx';

import { IConnectionExecutionContextInfo, NOT_INITIALIZED_CONTEXT_ID } from '@cloudbeaver/core-connections';
import { TaskScheduler } from '@cloudbeaver/core-executor';
import type { IResourceManagerParams, ResourceManagerResource } from '@cloudbeaver/core-resource-manager';
import { debounce, isArraysEqual, isObjectsEqual, isValuesEqual } from '@cloudbeaver/core-utils';
import { BaseSqlDataSource, ESqlDataSourceFeatures } from '@cloudbeaver/plugin-sql-editor';

import type { IResourceSqlDataSourceState } from './IResourceSqlDataSourceState';

interface IResourceProperties {
  'default-datasource'?: string;
  'default-catalog'?: string;
  'default-schema'?: string;
}

interface IResourceInfo {
  isReadonly?: (dataSource: ResourceSqlDataSource) => boolean;
}

interface IResourceActions {
  rename(
    dataSource: ResourceSqlDataSource,
    key: IResourceManagerParams,
    newKey: IResourceManagerParams
  ): Promise<IResourceManagerParams>;
  read(dataSource: ResourceSqlDataSource, key: IResourceManagerParams): Promise<string>;
  write(dataSource: ResourceSqlDataSource, key: IResourceManagerParams, value: string): Promise<void>;
  getProperties(
    dataSource: ResourceSqlDataSource,
    key: IResourceManagerParams
  ): Promise<Record<string, any>>;
  setProperties(
    dataSource: ResourceSqlDataSource,
    key: IResourceManagerParams,
    diff: Record<string, any>
  ): Promise<Record<string, any>>;
}

const VALUE_SYNC_DELAY = 1 * 1000;

export class ResourceSqlDataSource extends BaseSqlDataSource {
  static key = 'resource';

  get name(): string | null {
    if (!this.resourceKey) {
      return null;
    }

    const resource = this.resourceManagerResource.get(this.resourceKey)?.[0];

    return resource?.name ?? this.resourceKey.name ?? null;
  }

  get script(): string {
    return this._script;
  }

  get projectId(): string | null {
    return this.resourceKey?.projectId ?? null;
  }

  get executionContext(): IConnectionExecutionContextInfo | undefined {
    return this.state.executionContext;
  }

  get resourceKey(): IResourceManagerParams | undefined {
    return this.state.resourceKey;
  }

  get reload(): undefined | (() => Promise<void>) {
    return this.lastAction;
  }

  get features():ESqlDataSourceFeatures[] {
    if (this.isReadonly()) {
      return [];
    }

    return [ESqlDataSourceFeatures.setName];
  }

  private _script: string;
  private saved: boolean;
  private actions?: IResourceActions;
  private info?: IResourceInfo;
  private lastAction?: () => Promise<void>;
  private readonly state: IResourceSqlDataSourceState;
  private resourceProperties: IResourceProperties;

  private loaded: boolean;
  private readonly scheduler: TaskScheduler;
  private resourceUseKeyId: string | null;

  constructor(
    private readonly resourceManagerResource: ResourceManagerResource,
    state: IResourceSqlDataSourceState
  ) {
    super();
    this.state = state;
    this._script = '';
    this.saved = true;
    this.loaded = false;
    this.resourceUseKeyId = null;
    this.resourceProperties = {};
    this.scheduler = new TaskScheduler(() => true);
    this.debouncedWrite = debounce(this.debouncedWrite.bind(this), VALUE_SYNC_DELAY);

    makeObservable<this, '_script' | 'lastAction' | 'loaded' | 'resourceProperties'>(this, {
      script: computed,
      executionContext: computed,
      resourceKey: computed,
      features: computed<ESqlDataSourceFeatures[]>({
        equals: isArraysEqual,
      }),
      _script: observable,
      lastAction: observable.ref,
      loaded: observable,
      resourceProperties: observable,
      setExecutionContext: action,
      setScript: action,
      setResourceKey: action,
    });
  }

  isReadonly(): boolean {
    return !this.isLoaded() || this.info?.isReadonly?.(this) === true;
  }

  isOutdated(): boolean {
    return this.resourceKey !== undefined && super.isOutdated();
  }

  isLoaded(): boolean {
    return this.resourceKey === undefined || super.isLoaded() || this.loaded;
  }

  isLoading(): boolean {
    return this.scheduler.executing;
  }

  setResourceKey(resourceKey: IResourceManagerParams): void {
    if (this.state.resourceKey && this.resourceUseKeyId) {
      this.resourceManagerResource.free(this.state.resourceKey, this.resourceUseKeyId);
    }

    this.state.resourceKey = resourceKey;
    this.markOutdated();
    this.saved = true;
    this.loaded = false;
  }

  setActions(actions?: IResourceActions): void {
    this.actions = actions;
  }

  setInfo(info?: IResourceInfo): void {
    this.info = info;
  }

  setName(name: string | null): void {
    this.rename(name);
  }

  setProject(projectId: string | null): void {

  }

  canRename(name: string | null): boolean {
    if (this.isReadonly()) {
      return false;
    }

    if (!name) {
      return false;
    }

    name = name.trim();

    return (
      !!this.actions
      && !!this.resourceKey
      && this.saved
      && name.length > 0
    );
  }

  setScript(script: string): void {
    const previous = this._script;

    this._script = script;
    super.setScript(script);
    this.saved = false;

    if (previous !== script) {
      this.debouncedWrite();
    }
  }

  dispose(): void {
    super.dispose();
    if (this.state.resourceKey && this.resourceUseKeyId) {
      this.resourceManagerResource.free(this.state.resourceKey, this.resourceUseKeyId);
    }
  }

  async load(): Promise<void> {
    if (this.state.resourceKey) {
      this.resourceUseKeyId = this.resourceManagerResource.use(this.state.resourceKey);
    }
    await this.read();
    await this.updateProperties();
  }

  setExecutionContext(executionContext?: IConnectionExecutionContextInfo): void {
    if (
      this.resourceKey?.projectId
      && executionContext?.projectId
      && this.resourceKey.projectId !== executionContext.projectId
    ) {
      console.warn('Cant change execution context because of different projects');
      return;
    }

    if (
      !isObjectsEqual(toJS(this.state.executionContext), toJS(executionContext))
    ) {
      this.state.executionContext = toJS(executionContext);
    }

    if (
      this.isReadonly()
      || (
        this.resourceProperties['default-datasource'] === executionContext?.connectionId
        && this.resourceProperties['default-catalog'] === executionContext?.defaultCatalog
        && this.resourceProperties['default-schema'] === executionContext?.defaultSchema
      )
    ) {
      return;
    }

    this.resourceProperties['default-datasource'] = executionContext?.connectionId;
    this.resourceProperties['default-catalog'] = executionContext?.defaultCatalog;
    this.resourceProperties['default-schema'] = executionContext?.defaultSchema;

    this.setProperties(toJS(this.resourceProperties));
  }

  async rename(name: string | null) {
    await this.write();

    await this.scheduler.schedule(undefined, async () => {
      if (
        !this.actions
      || !this.resourceKey
      || !this.saved
      || !name?.trim()
      ) {
        return;
      }

      if (!name.toLowerCase().endsWith('.sql')) {
        name += '.sql';
      }

      this.lastAction = this.rename.bind(this, name);
      this.message = 'Renaming script...';

      try {
        this.exception = null;
        this.state.resourceKey = await this.actions.rename(this, this.resourceKey, { ...this.resourceKey, name });

        this.markOutdated();
        this.saved = true;
        this.loaded = false;
      } catch (exception: any) {
        this.exception = exception;
      } finally {
        this.message = undefined;
      }
    });
  }

  async read() {
    await this.scheduler.schedule(undefined, async () => {
      if (!this.actions || !this.resourceKey || !this.isOutdated() || !this.saved) {
        return;
      }

      this.lastAction = this.read.bind(this);
      this.message = 'Reading script...';

      try {
        this.exception = null;
        this._script = await this.actions.read(this, this.resourceKey);
        this.markUpdated();
        this.loaded = true;
        super.setScript(this.script);
      } catch (exception: any) {
        this.exception = exception;
      } finally {
        this.message = undefined;
      }
    });
  }

  async write() {
    await this.scheduler.schedule(undefined, async () => {
      if (!this.actions || !this.resourceKey || this.saved) {
        return;
      }

      this.lastAction = this.write.bind(this);
      this.message = 'Saving script...';

      try {
        this.exception = null;
        await this.actions.write(this, this.resourceKey, this.script);
        this.saved = true;
        this.markUpdated();
      } catch (exception: any) {
        this.exception = exception;
      } finally {
        this.message = undefined;
      }
    });
  }

  async setProperties(properties: IResourceProperties) {
    if (Object.keys(properties).length === 0) {
      return;
    }

    await this.scheduler.schedule(undefined, async () => {
      if (!this.actions || !this.resourceKey) {
        return;
      }

      this.lastAction = this.setProperties.bind(this, properties);
      this.message = 'Update info...';

      try {
        this.exception = null;

        if (!this.isReadonly()) {
          await this.actions.setProperties(
            this,
            this.resourceKey,
            properties
          );
        }

        await this.updateProperties();
      } catch (exception: any) {
        this.exception = exception;
      } finally {
        this.message = undefined;
      }
    });
  }

  private async updateProperties() {
    if (!this.actions || !this.resourceKey) {
      return;
    }

    const previousProperties = this.resourceProperties;

    const resourceProperties = await this.actions.getProperties(this, this.resourceKey);

    runInAction(() => {
      this.resourceProperties = toJS(resourceProperties);

      if (isObjectsEqual(toJS(previousProperties), toJS(this.resourceProperties)) && this.isReadonly()) {
        return;
      }

      const connectionId =  this.resourceProperties['default-datasource'];
      const defaultCatalog = this.resourceProperties['default-catalog'];
      const defaultSchema = this.resourceProperties['default-schema'];

      if (!this.resourceKey!.projectId) {
        return;
      }

      if (connectionId) {
        if (
          !isValuesEqual(this.state.executionContext?.connectionId, connectionId, null)
        || !isValuesEqual(this.state.executionContext?.defaultCatalog, defaultCatalog, null)
        || !isValuesEqual(this.state.executionContext?.defaultSchema, defaultSchema, null)
        || !isValuesEqual(this.state.executionContext?.projectId, this.resourceKey!.projectId, null)
        ) {
          this.state.executionContext = {
            id: NOT_INITIALIZED_CONTEXT_ID,
            projectId: this.resourceKey!.projectId,
            connectionId,
            defaultCatalog,
            defaultSchema,
          };
        }
      } else {
        this.state.executionContext = undefined;
      }
    });
  }

  private debouncedWrite() {
    this.write();
  }
}