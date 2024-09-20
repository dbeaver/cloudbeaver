/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { action, computed, makeObservable, observable } from 'mobx';

import type { IConnectionExecutionContextInfo } from '@cloudbeaver/core-connections';
import { injectable } from '@cloudbeaver/core-di';
import { type ISyncExecutor, SyncExecutor } from '@cloudbeaver/core-executor';

import type { ISqlEditorTabState } from '../ISqlEditorTabState.js';
import type { ISqlDataSource } from './ISqlDataSource.js';
import { MemorySqlDataSource } from './MemorySqlDataSource.js';

export interface ISqlDataSourceOptions {
  name?: string;
  script?: string;
  executionContext?: IConnectionExecutionContextInfo;
}

type ISqlDataSourceFactory = (editorId: string, options?: ISqlDataSourceOptions) => ISqlDataSource;

interface ISqlDataSourceFabric {
  key: string;
  getDataSource: ISqlDataSourceFactory;
  onDestroy?: (dataSource: ISqlDataSource, editorId: string) => Promise<void> | void;
  onUnload?: (dataSource: ISqlDataSource, editorId: string) => Promise<void> | void;
  canDestroy?: (dataSource: ISqlDataSource, editorId: string) => Promise<boolean> | boolean;
}

interface ISqlDataSourceProvider {
  provider: ISqlDataSourceFabric;
  dataSource: ISqlDataSource;
  isActionActive: boolean;
}

export interface ISQLDatasourceUpdateData {
  editorId: string;
  datasource: ISqlDataSource;
}

@injectable()
export class SqlDataSourceService {
  get dataSources(): [string, ISqlDataSource][] {
    return Array.from(this.providers.entries()).map(([editorId, provider]) => [editorId, provider.dataSource]);
  }

  readonly onCreate: ISyncExecutor<[string, string]>;
  readonly onUpdate: ISyncExecutor<ISQLDatasourceUpdateData>;
  private readonly dataSourceProviders: Map<string, ISqlDataSourceFabric>;
  private readonly providers: Map<string, ISqlDataSourceProvider>;

  constructor() {
    this.dataSourceProviders = new Map();
    this.providers = new Map();
    this.onCreate = new SyncExecutor();
    this.onUpdate = new SyncExecutor();
    this.onCreate.next<ISQLDatasourceUpdateData>(this.onUpdate, ([editorId]) => ({
      editorId,
      datasource: this.get(editorId)!,
    }));

    this.register({
      key: MemorySqlDataSource.key,
      getDataSource: (editorId, options) => new MemorySqlDataSource(options?.name, options?.script, options?.executionContext),
    });

    makeObservable<this, 'providers'>(this, {
      dataSources: computed,
      providers: observable.shallow,
      create: action,
      destroy: action,
    });
  }

  get(editorId: string): ISqlDataSource | undefined {
    return this.providers.get(editorId)?.dataSource;
  }

  create(state: ISqlEditorTabState, key: string, options?: ISqlDataSourceOptions): ISqlDataSource {
    const editorId = state.editorId;
    const provider = this.dataSourceProviders.get(key);

    if (!provider) {
      throw new Error(`SQL Data Source Provider with key (${key}) not found`);
    }

    let activeProvider = this.providers.get(editorId);

    if (activeProvider?.provider.key !== key) {
      if (activeProvider) {
        this.destroyProvider(editorId, activeProvider);
      }

      activeProvider = {
        provider,
        dataSource: provider.getDataSource(editorId, options),
        isActionActive: false,
      };

      activeProvider.dataSource.onUpdate.next<ISQLDatasourceUpdateData>(this.onUpdate, () => ({
        editorId,
        datasource: activeProvider!.dataSource,
      }));
      this.providers.set(editorId, activeProvider);
      state.datasourceKey = key;
      this.onCreate.execute([editorId, key]);
    }

    return activeProvider.dataSource;
  }

  async executeAction<T>(editorId: string, action: (dataSource: ISqlDataSource) => Promise<T> | T, notFound: () => void): Promise<T | undefined> {
    const provider = this.providers.get(editorId);

    if (!provider) {
      notFound();
      return undefined;
    }

    if (provider.isActionActive) {
      return;
    }

    try {
      provider.isActionActive = true;
      return await action(provider.dataSource);
    } finally {
      provider.isActionActive = false;
    }
  }

  async canDestroy(editorId: string): Promise<boolean> {
    const activeProvider = this.providers.get(editorId);

    return (await activeProvider?.provider.canDestroy?.(activeProvider.dataSource, editorId)) ?? true;
  }

  async destroySilent(editorId: string): Promise<void> {
    const activeProvider = this.providers.get(editorId);

    if (activeProvider) {
      await this.destroyProvider(editorId, activeProvider);
    }
  }

  async destroy(editorId: string): Promise<void> {
    const activeProvider = this.providers.get(editorId);

    if (activeProvider) {
      await this.destroyProvider(editorId, activeProvider);
    }
  }

  async unload(editorId: string): Promise<void> {
    const activeProvider = this.providers.get(editorId);

    if (activeProvider) {
      await this.unloadProvider(editorId, activeProvider);
    }

    this.providers.delete(editorId);
  }

  register(dataSourceOptions: ISqlDataSourceFabric) {
    if (this.dataSourceProviders.has(dataSourceOptions.key)) {
      throw new Error(`SQL Data Source with key (${dataSourceOptions.key}) already registered`);
    }

    this.dataSourceProviders.set(dataSourceOptions.key, dataSourceOptions);
  }

  private async unloadProvider(editorId: string, provider: ISqlDataSourceProvider): Promise<void> {
    await provider.provider.onUnload?.(provider.dataSource, editorId);
    await provider.dataSource.dispose();
  }

  private async destroyProvider(editorId: string, provider: ISqlDataSourceProvider): Promise<void> {
    await provider.provider.onDestroy?.(provider.dataSource, editorId);
    await provider.dataSource.dispose();
  }
}
