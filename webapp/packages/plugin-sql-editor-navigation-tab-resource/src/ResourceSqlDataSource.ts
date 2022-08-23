/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { action, computed, makeObservable, observable } from 'mobx';

import type { IConnectionExecutionContextInfo } from '@cloudbeaver/core-connections';
import type { NavNodeInfoResource } from '@cloudbeaver/core-navigation-tree';
import { debounce } from '@cloudbeaver/core-utils';
import { BaseSqlDataSource, ESqlDataSourceFeatures } from '@cloudbeaver/plugin-sql-editor';

import type { IResourceNodeInfo, IResourceSqlDataSourceState } from './IResourceSqlDataSourceState';

interface IResourceActions {
  rename(dataSource: ResourceSqlDataSource, nodeId: string, name: string): Promise<string>;
  read(dataSource: ResourceSqlDataSource, nodeId: string): Promise<string>;
  write(dataSource: ResourceSqlDataSource, nodeId: string, value: string): Promise<void>;
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

  private _script: string;
  private saved: boolean;
  private actions?: IResourceActions;
  private lastAction?: () => Promise<void>;
  private readonly state: IResourceSqlDataSourceState;

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
    this.loading = false;
    this.loaded = false;
    this.features = [ESqlDataSourceFeatures.setName];
    this.debouncedWrite = debounce(this.debouncedWrite.bind(this), VALUE_SYNC_DELAY);

    makeObservable<this, '_script' | 'lastAction' | 'loading' | 'loaded'>(this, {
      script: computed,
      executionContext: computed,
      nodeInfo: computed,
      _script: observable,
      lastAction: observable,
      loading: observable,
      loaded: observable,
      setScript: action,
      setNodeInfo: action,
    });
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

  setName(name: string | null): void {
    this.rename(name);
  }

  canRename(name: string | null): boolean {
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
    this.state.executionContext = executionContext;
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

  private debouncedWrite() {
    this.write();
  }
}