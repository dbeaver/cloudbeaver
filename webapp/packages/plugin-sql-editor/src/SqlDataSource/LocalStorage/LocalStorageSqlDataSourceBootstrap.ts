/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { action, makeObservable, observable } from 'mobx';

import type { IConnectionExecutionContextInfo } from '@cloudbeaver/core-connections';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { LocalStorageSaveService } from '@cloudbeaver/core-settings';

import { SqlDataSourceService } from '../SqlDataSourceService';
import type { ILocalStorageSqlDataSourceState } from './ILocalStorageSqlDataSourceState';
import { LocalStorageSqlDataSource } from './LocalStorageSqlDataSource';

const localStorageKey = 'local-storage-sql-data-source';

@injectable()
export class LocalStorageSqlDataSourceBootstrap extends Bootstrap {
  private readonly dataSourceStateState = new Map<string, ILocalStorageSqlDataSourceState>();

  constructor(
    private readonly sqlDataSourceService: SqlDataSourceService,
    localStorageSaveService: LocalStorageSaveService,
  ) {
    super();
    this.dataSourceStateState = new Map();

    makeObservable<this, 'dataSourceStateState' | 'createState'>(this, {
      createState: action,
      dataSourceStateState: observable,
    });

    localStorageSaveService.withAutoSave(
      this.dataSourceStateState,
      localStorageKey,
      map => {
        for (const [key, value] of Array.from(map.entries())) {
          if (
            typeof value.script !== 'string'
            || !['undefined', 'object'].includes(typeof value.executionContext)
            || !['string', 'undefined', 'object'].includes(typeof value.executionContext?.connectionId)
            || !['string', 'undefined', 'object'].includes(typeof value.executionContext?.id)
            || !['string', 'undefined', 'object'].includes(typeof value.executionContext?.defaultCatalog)
            || !['string', 'undefined', 'object'].includes(typeof value.executionContext?.defaultSchema)
          ) {
            map.delete(key);
          }
        }
        return map;
      }
    );
  }

  register(): void | Promise<void> {
    this.sqlDataSourceService.register({
      key: LocalStorageSqlDataSource.key,
      getDataSource: (editorId, script, executionContext) => new LocalStorageSqlDataSource(this.createState(
        editorId,
        script,
        executionContext,
      )),
      onDestroy: (_, editorId) => this.deleteState(editorId),
    });
  }

  load(): void | Promise<void> { }

  private createState(
    editorId: string,
    script?: string,
    executionContext?: IConnectionExecutionContextInfo
  ): ILocalStorageSqlDataSourceState {
    let state = this.dataSourceStateState.get(editorId);

    if (!state) {
      state = observable<ILocalStorageSqlDataSourceState>({
        script: script ?? '',
        executionContext,
      });

      this.dataSourceStateState.set(editorId, state);
    }

    return state;
  }

  private deleteState(editorId: string): void {
    this.dataSourceStateState.delete(editorId);
  }
}