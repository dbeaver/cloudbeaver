/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { action, computed, makeObservable, observable, toJS } from 'mobx';

import type { IConnectionExecutionContextInfo } from '@cloudbeaver/core-connections';
import type { NavNodeInfoResource } from '@cloudbeaver/core-navigation-tree';
import { debounce, isArraysEqual } from '@cloudbeaver/core-utils';
import { BaseSqlDataSource, ESqlDataSourceFeatures } from '@cloudbeaver/plugin-sql-editor';

import type { IResourceNodeInfo, IResourceSqlDataSourceState } from './IResourceSqlDataSourceState';

interface IResourceProperties {
  'default-datasource'?: string;
  'default-catalog'?: string;
  'default-schema'?: string;
}

interface IResourceInfo {
  isReadonly?: (dataSource: ResourceSqlDataSource) => boolean;
}

interface IResourceActions {
  rename(dataSource: ResourceSqlDataSource, nodeId: string, name: string): Promise<string>;
  read(dataSource: ResourceSqlDataSource, nodeId: string): Promise<string>;
  write(dataSource: ResourceSqlDataSource, nodeId: string, value: string): Promise<void>;
  getProperties(
    dataSource: ResourceSqlDataSource,
    nodeId: string
  ): Promise<Record<string, any>>;
  setProperties(
    dataSource: ResourceSqlDataSource,
    nodeId: string,
    diff: Record<string, any>
  ): Promise<Record<string, any>>;
}

const VALUE_SYNC_DELAY = 1 * 1000;

export class ResourceSqlDataSource extends BaseSqlDataSource {
  static key = 'resource';

  get name(): string | null {
    if (!this.nodeInfo) {
      return this.state.name ?? null;
    }

    return this.navNodeInfoResource.get(this.nodeInfo.nodeId)?.name ?? this.state.name ?? null;
  }

  get script(): string {
    return this._script;
  }

  get executionContext(): IConnectionExecutionContextInfo | undefined {
    return this.state.executionContext;
  }

  get nodeInfo(): IResourceNodeInfo | undefined {
    return this.state.nodeInfo;
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
  private propertySaved: boolean;
  private actions?: IResourceActions;
  private info?: IResourceInfo;
  private lastAction?: () => Promise<void>;
  private readonly state: IResourceSqlDataSourceState;
  private resourceProperties: IResourceProperties;

  private loading: boolean;
  private loaded: boolean;

  constructor(
    private readonly navNodeInfoResource: NavNodeInfoResource,
    state: IResourceSqlDataSourceState
  ) {
    super();
    this.state = state;
    this._script = '';
    this.saved = true;
    this.propertySaved = true;
    this.loading = false;
    this.loaded = false;
    this.resourceProperties = {};
    this.debouncedWrite = debounce(this.debouncedWrite.bind(this), VALUE_SYNC_DELAY);
    this.debouncedSetProperty = debounce(this.debouncedSetProperty.bind(this), VALUE_SYNC_DELAY);

    makeObservable<this, '_script' | 'lastAction' | 'loading' | 'loaded' | 'resourceProperties'>(this, {
      script: computed,
      executionContext: computed,
      nodeInfo: computed,
      features: computed<ESqlDataSourceFeatures[]>({
        equals: isArraysEqual,
      }),
      _script: observable,
      lastAction: observable.ref,
      loading: observable,
      loaded: observable,
      resourceProperties: observable,
      setScript: action,
      setNodeInfo: action,
    });
  }

  isReadonly(): boolean {
    return !this.isLoaded() || this.info?.isReadonly?.(this) === true;
  }

  isOutdated(): boolean {
    return this.nodeInfo !== undefined && super.isOutdated();
  }

  isLoaded(): boolean {
    return this.nodeInfo === undefined || super.isLoaded() || this.loaded;
  }

  isLoading(): boolean {
    return this.loading;
  }

  setNodeInfo(nodeInfo?: IResourceNodeInfo): void {
    this.state.nodeInfo = nodeInfo;
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
      && !!this.nodeInfo
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

  async load(): Promise<void> {
    await this.read();
  }

  setExecutionContext(executionContext?: IConnectionExecutionContextInfo): void {
    this.state.executionContext = toJS(executionContext);

    this.resourceProperties['default-datasource'] = executionContext?.connectionId;
    this.resourceProperties['default-catalog'] = executionContext?.defaultCatalog;
    this.resourceProperties['default-schema'] = executionContext?.defaultSchema;

    this.propertySaved = false;
    this.debouncedSetProperty();
  }

  async rename(name: string | null) {
    await this.write();

    if (
      !this.actions
      || !this.nodeInfo
      || !this.saved
      || !name?.trim()
    ) {
      return;
    }

    if (!name.toLowerCase().endsWith('.sql')) {
      name += '.sql';
    }

    this.lastAction = this.rename.bind(this, name);
    this.loading = true;
    this.message = 'Renaming script...';

    try {
      this.exception = null;
      this.nodeInfo.nodeId = await this.actions.rename(this, this.nodeInfo.nodeId, name);

      if (this.nodeInfo.parents.length > 0) {
        this.nodeInfo.parents.splice(this.nodeInfo.parents.length - 1, 1, this.nodeInfo.nodeId);
      }

      this.markOutdated();
      this.saved = true;
      this.loaded = false;
    } catch (exception: any) {
      this.exception = exception;
    } finally {
      this.loading = false;
      this.message = undefined;
    }
  }

  async read() {
    if (!this.actions || !this.nodeInfo || !this.isOutdated() || !this.saved) {
      return;
    }

    this.lastAction = this.read.bind(this);
    this.loading = true;
    this.message = 'Reading script...';

    try {
      this.exception = null;
      this._script = await this.actions.read(this, this.nodeInfo.nodeId);

      await this.updateProperty();

      this.state.name = this.name ?? undefined;
      this.markUpdated();
      this.loaded = true;
      super.setScript(this.script);
    } catch (exception: any) {
      this.exception = exception;
    } finally {
      this.loading = false;
      this.message = undefined;
    }
  }

  async write() {
    if (!this.actions || !this.nodeInfo || this.saved) {
      return;
    }

    this.lastAction = this.write.bind(this);
    this.loading = true;
    this.message = 'Saving script...';

    try {
      this.exception = null;
      await this.actions.write(this, this.nodeInfo.nodeId, this.script);
      this.state.name = this.name ?? undefined;
      this.saved = true;
      this.markUpdated();
    } catch (exception: any) {
      this.exception = exception;
    } finally {
      this.loading = false;
      this.message = undefined;
    }
  }

  async setProperty() {
    if (!this.actions || !this.nodeInfo || this.propertySaved || !this.loaded) {
      return;
    }

    this.lastAction = this.setProperty.bind(this);
    this.loading = true;
    this.message = 'Update info...';

    try {
      this.exception = null;
      await this.actions.setProperties(
        this,
        this.nodeInfo.nodeId,
        toJS(this.resourceProperties)
      );
      await this.updateProperty();
      this.markUpdated();
      this.propertySaved = true;
    } catch (exception: any) {
      this.exception = exception;
    } finally {
      this.loading = false;
      this.message = undefined;
    }
  }

  private async updateProperty() {
    if (!this.actions || !this.nodeInfo) {
      return;
    }

    this.resourceProperties = toJS(await this.actions.getProperties(this, this.nodeInfo.nodeId));

    const connectionId =  this.resourceProperties['default-datasource'];
    const defaultCatalog = this.resourceProperties['default-catalog'];
    const defaultSchema = this.resourceProperties['default-schema'];

    if (!connectionId || !this.nodeInfo.projectId) {
      return;
    }

    let id = this.state.executionContext?.id ?? '-1';

    if (
      this.state.executionContext?.connectionId !== connectionId
      || this.nodeInfo.projectId !== this.state.executionContext.projectId
    ) {
      id = '-1';
    }

    this.state.executionContext = {
      id,
      projectId: this.nodeInfo.projectId,
      connectionId,
      defaultCatalog,
      defaultSchema,
    };
  }

  private debouncedWrite() {
    this.write();
  }

  private debouncedSetProperty() {
    this.setProperty();
  }
}