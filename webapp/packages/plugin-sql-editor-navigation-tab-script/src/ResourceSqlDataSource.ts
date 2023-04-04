/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { action, computed, makeObservable, observable, runInAction, toJS } from 'mobx';

import { ConnectionInfoResource, createConnectionParam, IConnectionExecutionContextInfo, NOT_INITIALIZED_CONTEXT_ID } from '@cloudbeaver/core-connections';
import { TaskScheduler } from '@cloudbeaver/core-executor';
import { getRmResourceKey, ResourceManagerResource } from '@cloudbeaver/core-resource-manager';
import { isResourceAlias, ResourceKey, ResourceKeySimple, ResourceKeyUtils } from '@cloudbeaver/core-sdk';
import { createPath, debounce, getPathName, getPathParent, isArraysEqual, isObjectsEqual, isValuesEqual } from '@cloudbeaver/core-utils';
import { BaseSqlDataSource, ESqlDataSourceFeatures } from '@cloudbeaver/plugin-sql-editor';

import type { IResourceSqlDataSourceState } from './IResourceSqlDataSourceState';

interface IResourceInfo {
  isReadonly?: (dataSource: ResourceSqlDataSource) => boolean;
}

interface IResourceActions {
  rename(
    dataSource: ResourceSqlDataSource,
    key: string,
    newKey: string
  ): Promise<string>;
  read(dataSource: ResourceSqlDataSource, key: string): Promise<string>;
  write(dataSource: ResourceSqlDataSource, key: string, value: string): Promise<void>;
  getProperties(
    dataSource: ResourceSqlDataSource,
    key: string
  ): Promise<IConnectionExecutionContextInfo | undefined>;
  setProperties(
    dataSource: ResourceSqlDataSource,
    key: string,
    executionContext: IConnectionExecutionContextInfo | undefined
  ): Promise<IConnectionExecutionContextInfo | undefined>;
}

const VALUE_SYNC_DELAY = 1 * 1000;

export class ResourceSqlDataSource extends BaseSqlDataSource {
  static key = 'resource';

  get name(): string | null {
    if (!this.resourceKey) {
      return null;
    }

    const resource = this.resourceManagerResource.get(this.resourceKey);

    return resource?.name ?? getPathName(this.resourceKey);
  }

  get script(): string {
    return this._script;
  }

  get projectId(): string | null {
    if (this.resourceKey === undefined) {
      return super.projectId;
    }
    const key = getRmResourceKey(this.resourceKey);
    return key.projectId;
  }

  get executionContext(): IConnectionExecutionContextInfo | undefined {
    if (
      this.state.executionContext
      && !this.connectionInfoResource.has(createConnectionParam(
        this.state.executionContext.projectId,
        this.state.executionContext.connectionId
      ))) {
      return undefined;
    }
    return this.state.executionContext;
  }

  get resourceKey(): string | undefined {
    return this.state.resourceKey;
  }

  get reload(): undefined | (() => Promise<void>) {
    return this.lastAction;
  }

  get features():ESqlDataSourceFeatures[] {
    if (this.isReadonly()) {
      return [ESqlDataSourceFeatures.script];
    }

    return [ESqlDataSourceFeatures.script, ESqlDataSourceFeatures.setName];
  }

  private _script: string;
  private saved: boolean;
  private actions?: IResourceActions;
  private info?: IResourceInfo;
  private lastAction?: () => Promise<void>;
  private readonly state: IResourceSqlDataSourceState;

  private loaded: boolean;
  private readonly scheduler: TaskScheduler;
  private resourceUseKeyId: string | null;

  constructor(
    private readonly connectionInfoResource: ConnectionInfoResource,
    private readonly resourceManagerResource: ResourceManagerResource,
    state: IResourceSqlDataSourceState
  ) {
    super();
    this.state = state;
    this._script = '';
    this.saved = true;
    this.loaded = false;
    this.resourceUseKeyId = null;
    this.scheduler = new TaskScheduler(() => true);
    this.debouncedWrite = debounce(this.debouncedWrite.bind(this), VALUE_SYNC_DELAY);
    this.syncResource = this.syncResource.bind(this);

    resourceManagerResource.onItemUpdate.addHandler(this.syncResource);

    makeObservable<this, '_script' | 'lastAction' | 'loaded'>(this, {
      script: computed,
      executionContext: computed,
      resourceKey: computed,
      features: computed<ESqlDataSourceFeatures[]>({
        equals: isArraysEqual,
      }),
      _script: observable,
      lastAction: observable.ref,
      loaded: observable,
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

  setResourceKey(resourceKey: string): void {
    if (this.state.resourceKey && this.resourceUseKeyId) {
      this.resourceManagerResource.free(toJS(this.state.resourceKey), this.resourceUseKeyId);
      this.resourceUseKeyId = null;
    }

    this.state.resourceKey = toJS(resourceKey);
    this.reloadResource();
    this.onUpdate.execute();
  }

  setActions(actions?: IResourceActions): void {
    this.actions = actions;
  }

  setInfo(info?: IResourceInfo): void {
    this.info = info;
  }

  setName(name: string | null): void {
    this.rename(name);
    super.setName(name);
  }

  setProject(projectId: string | null): void {
    super.setProject(projectId);
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
    this.resourceManagerResource.onItemUpdate.removeHandler(this.syncResource);
    if (this.state.resourceKey && this.resourceUseKeyId) {
      this.resourceManagerResource.free(this.state.resourceKey, this.resourceUseKeyId);
      this.resourceUseKeyId = null;
    }
  }

  syncResource(key: ResourceKeySimple<string>) {
    const resourceKey = this.resourceKey;
    if (resourceKey && ResourceKeyUtils.some(key, key => resourceKey.startsWith(key))) {
      this.reloadResource();
    }
  }

  reloadResource(): void {
    this.markOutdated();
    this.saved = true;
    this.loaded = false;
  }

  async load(): Promise<void> {
    if (this.state.resourceKey && !this.resourceUseKeyId) {
      this.resourceUseKeyId = this.resourceManagerResource.use(this.state.resourceKey);
    }
    await this.read();
  }

  setExecutionContext(executionContext?: IConnectionExecutionContextInfo): void {
    if (
      this.resourceKey
      && executionContext?.projectId
      && getRmResourceKey(this.resourceKey).projectId !== executionContext.projectId
    ) {
      throw new Error('Resource SQL Data Source and Execution context projects don\t match');
    }

    if (
      !isObjectsEqual(toJS(this.state.executionContext), toJS(executionContext))
    ) {
      const initNew = (
        !isValuesEqual(executionContext?.connectionId, this.executionContext?.connectionId, undefined)
        || !isValuesEqual(executionContext?.defaultCatalog, this.executionContext?.defaultCatalog, undefined)
        || !isValuesEqual(executionContext?.defaultSchema, this.executionContext?.defaultSchema, undefined)
      );

      if (executionContext) {
        if (initNew) {
          executionContext.id = NOT_INITIALIZED_CONTEXT_ID;
        } else if (executionContext.id === NOT_INITIALIZED_CONTEXT_ID) {
          executionContext.id = this.executionContext?.id ?? NOT_INITIALIZED_CONTEXT_ID;

          if (this.executionContext?.id !== NOT_INITIALIZED_CONTEXT_ID) {
            return;
          }
        }
      }

      this.state.executionContext = toJS(executionContext);
      super.setExecutionContext(executionContext);

      this.saveProperties();
    }

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

      // TODO: use createResourceOfType instead
      if (!name.toLowerCase().endsWith('.sql')) {
        name += '.sql';
      }

      this.lastAction = this.rename.bind(this, name);
      this.message = 'Renaming script...';

      try {
        this.exception = null;
        this.setResourceKey(await this.actions.rename(
          this,
          this.resourceKey,
          createPath(getPathParent(this.resourceKey), name))
        );
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

        const executionContext = await this.actions.getProperties(this, this.resourceKey);

        runInAction(() => {
          if (executionContext) {
            this.setExecutionContext(executionContext);
          } else {
            this.setExecutionContext();
          }
        });

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

  private async saveProperties() {
    await this.scheduler.schedule(undefined, async () => {
      if (!this.actions || !this.resourceKey) {
        return;
      }

      this.lastAction = this.saveProperties.bind(this);
      this.message = 'Update info...';

      try {
        this.exception = null;

        if (!this.isReadonly()) {
          const executionContext = await this.actions.setProperties(
            this,
            this.resourceKey,
            this.executionContext
          );

          if (executionContext) {
            this.setExecutionContext(executionContext);
          } else {
            this.setExecutionContext();
          }
        }
      } catch (exception: any) {
        this.exception = exception;
      } finally {
        this.message = undefined;
      }
    });
  }

  private debouncedWrite() {
    this.write();
  }
}