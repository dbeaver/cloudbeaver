/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { action, computed, makeObservable, observable, runInAction, toJS } from 'mobx';

import {
  ConnectionInfoResource,
  createConnectionParam,
  IConnectionExecutionContextInfo,
  NOT_INITIALIZED_CONTEXT_ID,
} from '@cloudbeaver/core-connections';
import { TaskScheduler } from '@cloudbeaver/core-executor';
import type { ProjectInfoResource } from '@cloudbeaver/core-projects';
import { getRmResourceKey, ResourceManagerResource } from '@cloudbeaver/core-resource-manager';
import { isResourceAlias, ResourceKey, ResourceKeyUtils } from '@cloudbeaver/core-sdk';
import { debounce, getPathName, isArraysEqual, isNotNullDefined, isObjectsEqual, isValuesEqual } from '@cloudbeaver/core-utils';
import { SCRIPTS_TYPE_ID } from '@cloudbeaver/plugin-resource-manager-scripts';
import { BaseSqlDataSource, ESqlDataSourceFeatures, SqlEditorService } from '@cloudbeaver/plugin-sql-editor';

import type { IResourceSqlDataSourceState } from './IResourceSqlDataSourceState';

interface IResourceInfo {
  isReadonly?: (dataSource: ResourceSqlDataSource) => boolean;
}

interface IResourceActions {
  rename(dataSource: ResourceSqlDataSource, key: string, name: string): Promise<string>;
  read(dataSource: ResourceSqlDataSource, key: string): Promise<string>;
  write(dataSource: ResourceSqlDataSource, key: string, value: string): Promise<void>;
  getProperties(dataSource: ResourceSqlDataSource, key: string): Promise<IConnectionExecutionContextInfo | undefined>;
  setProperties(
    dataSource: ResourceSqlDataSource,
    key: string,
    executionContext: IConnectionExecutionContextInfo | undefined,
  ): Promise<IConnectionExecutionContextInfo | undefined>;
}

const VALUE_SYNC_DELAY = 1 * 1000;

export class ResourceSqlDataSource extends BaseSqlDataSource {
  static key = 'resource';

  get name(): string | null {
    if (!this.resourceKey || !this.projectId) {
      return null;
    }

    const resource = this.resourceManagerResource.get(this.resourceKey);

    return this.projectInfoResource.getNameWithoutExtension(this.projectId, SCRIPTS_TYPE_ID, resource?.name ?? getPathName(this.resourceKey));
  }

  get script(): string {
    return this.state.script;
  }

  get baseScript(): string {
    return this.state.baseScript;
  }

  get baseExecutionContext(): IConnectionExecutionContextInfo | undefined {
    return this.state.baseExecutionContext;
  }

  get projectId(): string | null {
    if (this.resourceKey === undefined) {
      return super.projectId;
    }
    const key = getRmResourceKey(this.resourceKey);
    return key.projectId;
  }

  get executionContext(): IConnectionExecutionContextInfo | undefined {
    const executionContext = this.state?.executionContext;
    if (!executionContext || !this.connectionInfoResource.has(createConnectionParam(executionContext.projectId, executionContext.connectionId))) {
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

  get features(): ESqlDataSourceFeatures[] {
    if (this.isReadonly()) {
      return [ESqlDataSourceFeatures.script, ESqlDataSourceFeatures.query, ESqlDataSourceFeatures.executable];
    }

    return [ESqlDataSourceFeatures.script, ESqlDataSourceFeatures.query, ESqlDataSourceFeatures.executable, ESqlDataSourceFeatures.setName];
  }

  get isAutoSaveEnabled(): boolean {
    return this.sqlEditorService.autoSave;
  }

  private actions?: IResourceActions;
  private info?: IResourceInfo;
  private lastAction: (() => Promise<void>) | undefined;
  private state!: IResourceSqlDataSourceState;

  private loaded: boolean;
  private readonly scheduler: TaskScheduler;
  private resourceUseKeyId: string | null;

  constructor(
    private readonly projectInfoResource: ProjectInfoResource,
    private readonly connectionInfoResource: ConnectionInfoResource,
    private readonly resourceManagerResource: ResourceManagerResource,
    private readonly sqlEditorService: SqlEditorService,
    state: IResourceSqlDataSourceState,
  ) {
    super();
    this.bindState(state);
    this.lastAction = undefined;
    this.loaded = false;
    this.resourceUseKeyId = null;
    this.scheduler = new TaskScheduler(() => true);
    this.debouncedWrite = debounce(this.debouncedWrite.bind(this), VALUE_SYNC_DELAY);
    this.debouncedSaveProperties = debounce(this.debouncedSaveProperties.bind(this), VALUE_SYNC_DELAY);
    this.syncResource = this.syncResource.bind(this);

    resourceManagerResource.onDataOutdated.addHandler(this.syncResource);

    makeObservable<this, 'lastAction' | 'loaded'>(this, {
      script: computed,
      executionContext: computed,
      resourceKey: computed,
      features: computed<ESqlDataSourceFeatures[]>({
        equals: isArraysEqual,
      }),
      lastAction: observable.ref,
      loaded: observable,
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

  canRename(name: string | null): boolean {
    if (this.isReadonly()) {
      return false;
    }

    if (!name) {
      return false;
    }

    name = name.trim();

    return !!this.actions && !!this.resourceKey && name.length > 0;
  }

  setResourceKey(resourceKey: string | undefined): void {
    if (this.state.resourceKey && this.resourceUseKeyId) {
      this.resourceManagerResource.free(toJS(this.state.resourceKey), this.resourceUseKeyId);
      this.resourceUseKeyId = null;
    }

    this.state.resourceKey = toJS(resourceKey);
    this.loaded = false;
    this.markOutdated();
    this.onUpdate.execute();
  }

  setActions(actions?: IResourceActions): void {
    this.actions = actions;
  }

  setInfo(info?: IResourceInfo): void {
    this.info = info;
  }

  setName(name: string | null): void {
    name = name?.trim() ?? null;
    if (!name || name === this.name) {
      return;
    }

    const previousName = this.name;
    super.setName(name);

    this.rename(name).catch(() => {
      super.setName(previousName);
    });
  }

  setProject(projectId: string | null): void {
    super.setProject(projectId);
  }

  setScript(script: string): void {
    const previous = this.state.script;
    if (previous === script) {
      return;
    }

    this.state.script = script;
    super.setScript(script);

    if (this.isAutoSaveEnabled) {
      this.debouncedWrite();
    }
  }

  setExecutionContext(executionContext: IConnectionExecutionContextInfo | undefined): void {
    if (executionContext) {
      executionContext = JSON.parse(JSON.stringify(toJS(executionContext) ?? {}));
    }

    const projectId = executionContext?.projectId;

    if (this.resourceKey && isNotNullDefined(projectId) && getRmResourceKey(this.resourceKey).projectId !== projectId) {
      throw new Error('Resource SQL Data Source and Execution context projects don\t match');
    }

    if (!isObjectsEqual(toJS(this.state.executionContext), executionContext)) {
      const initNew =
        !isValuesEqual(executionContext?.connectionId, this.executionContext?.connectionId, undefined) ||
        !isValuesEqual(executionContext?.defaultCatalog, this.executionContext?.defaultCatalog, undefined) ||
        !isValuesEqual(executionContext?.defaultSchema, this.executionContext?.defaultSchema, undefined);

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

      this.state.executionContext = executionContext;
      super.setExecutionContext(executionContext);

      if (this.isAutoSaveEnabled) {
        this.debouncedSaveProperties();
      }
    }
  }

  async load(): Promise<void> {
    if (this.state.resourceKey && !this.resourceUseKeyId) {
      this.resourceUseKeyId = this.resourceManagerResource.use(this.state.resourceKey);
    }
    await this.read();
  }

  async save(): Promise<void> {
    try {
      await this.write();
      await this.saveProperties();
      super.save();
    } catch (exception: any) {
      this.exception = exception;
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

  bindState(state: IResourceSqlDataSourceState): void {
    this.state = state;
    this.outdated = true;
    this.history.restore(state.history);
  }

  private syncResource(key: ResourceKey<string>) {
    if (isResourceAlias(key)) {
      return;
    }

    const resourceKey = this.resourceKey;
    if (resourceKey && ResourceKeyUtils.some(key, key => resourceKey.startsWith(key))) {
      this.markOutdated();
    }
  }

  private async rename(name: string) {
    await this.save();

    await this.scheduler.schedule(undefined, async () => {
      if (!this.actions || !this.resourceKey) {
        return;
      }

      this.lastAction = this.rename.bind(this, name);

      try {
        if (!this.isSaved) {
          throw new Error('Please save changes before renaming');
        }
        this.exception = null;

        this.message = 'plugin_sql_editor_navigation_tab_script_state_renaming';
        this.setResourceKey(await this.actions.rename(this, this.resourceKey, name));
      } catch (exception: any) {
        this.exception = exception;
        throw exception;
      } finally {
        this.message = undefined;
      }
    });
  }

  private async read() {
    await this.scheduler.schedule(undefined, async () => {
      if (!this.actions || !this.resourceKey || !this.isOutdated()) {
        return;
      }

      this.lastAction = this.read.bind(this);

      try {
        this.exception = null;
        await this.readData();
      } catch (exception: any) {
        this.exception = exception;
      }
    });
  }

  private async saveProperties() {
    await this.scheduler.schedule(undefined, async () => {
      if (!this.actions || !this.resourceKey || this.isExecutionContextSaved) {
        return;
      }

      this.lastAction = this.saveProperties.bind(this);

      try {
        this.exception = null;

        if (!this.isReadonly()) {
          this.message = 'plugin_sql_editor_navigation_tab_script_state_updating';
          const executionContext = await this.actions.setProperties(this, this.resourceKey, this.executionContext);

          this.setExecutionContext(executionContext);
          this.setBaseExecutionContext(this.executionContext);
        }
      } finally {
        this.message = undefined;
      }
    });
  }

  private async write() {
    await this.scheduler.schedule(undefined, async () => {
      if (!this.actions || !this.resourceKey || this.isScriptSaved) {
        return;
      }

      this.lastAction = this.write.bind(this);

      try {
        this.exception = null;
        await this.readData();

        if (!this.isIncomingChanges) {
          this.message = 'plugin_sql_editor_navigation_tab_script_state_saving';
          await this.actions.write(this, this.resourceKey, this.script);
          this.setBaseScript(this.script);
        }
      } finally {
        this.message = undefined;
      }
    });
  }

  private async readData() {
    try {
      if (!this.actions || !this.resourceKey) {
        return;
      }
      this.message = 'plugin_sql_editor_navigation_tab_script_state_reading';
      const script = await this.actions.read(this, this.resourceKey);
      const executionContext = await this.actions.getProperties(this, this.resourceKey);

      runInAction(() => {
        if (!this.loaded) {
          if (this.baseScript !== script) {
            this.setScript(script);
          }
          if (!isObjectsEqual(toJS(this.baseExecutionContext), executionContext)) {
            this.setExecutionContext(executionContext);
          }

          this.setBaseScript(script);
          this.setBaseExecutionContext(executionContext);
        } else {
          this.setIncomingExecutionContext(executionContext);
          this.setIncomingScript(script);
        }

        this.markUpdated();
        this.loaded = true;
      });
    } finally {
      this.message = undefined;
    }
  }

  private debouncedWrite() {
    this.write();
  }

  private debouncedSaveProperties() {
    this.saveProperties();
  }

  protected setBaseScript(script: string): void {
    this.state.baseScript = script;
  }

  protected setBaseExecutionContext(executionContext: IConnectionExecutionContextInfo | undefined): void {
    this.state.baseExecutionContext = toJS(executionContext);
  }
}
