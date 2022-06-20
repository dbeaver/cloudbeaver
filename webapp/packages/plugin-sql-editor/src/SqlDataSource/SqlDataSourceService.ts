/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { IConnectionExecutionContextInfo } from '@cloudbeaver/core-connections';
import { injectable } from '@cloudbeaver/core-di';

import type { ISqlDataSource } from './ISqlDataSource';
import { MemorySqlDataSource } from './MemorySqlDataSource';

type ISqlDataSourceFabric = (
  editorId: string,
  script?: string,
  executionContext?: IConnectionExecutionContextInfo,
) => ISqlDataSource;

interface ISqlDataSourceOptions {
  key: string;
  fabric: ISqlDataSourceFabric;
  onDestroy?: (editorId: string)=> void;
  canDestroy?: (editorId: string)=> Promise<void>;
}

interface ISqlDataSourceProvider {
  provider: ISqlDataSourceOptions;
  dataSource: ISqlDataSource;
}

@injectable()
export class SqlDataSourceService {
  private readonly dataSourceProviders: Map<string, ISqlDataSourceOptions>;
  private readonly providers: Map<string, ISqlDataSourceProvider>;

  constructor() {
    this.dataSourceProviders = new Map();
    this.providers = new Map();

    this.register({
      key: MemorySqlDataSource.key,
      fabric: (editorId, script, executionContext) => new MemorySqlDataSource(script, executionContext),
    });
  }

  get(editorId: string): ISqlDataSource | undefined {
    return this.providers.get(editorId)?.dataSource;
  }

  create(
    editorId: string,
    key: string,
    script?: string,
    executionContext?: IConnectionExecutionContextInfo,
  ): ISqlDataSource {
    const provider = this.dataSourceProviders.get(key);

    if (!provider) {
      throw new Error(`SQL Data Source Provider with key (${key}) not found`);
    }

    let activeProvider = this.providers.get(editorId);

    if (activeProvider?.provider.key !== key) {
      activeProvider?.provider.onDestroy?.(editorId);
      activeProvider = {
        provider,
        dataSource: provider.fabric(editorId, script, executionContext),
      };
    }

    return activeProvider.dataSource;
  }

  register(dataSourceOptions: ISqlDataSourceOptions) {
    if (this.dataSourceProviders.has(dataSourceOptions.key)) {
      throw new Error(`SQL Data Source with key (${dataSourceOptions.key}) already registered`);
    }

    this.dataSourceProviders.set(dataSourceOptions.key, dataSourceOptions);
  }
}