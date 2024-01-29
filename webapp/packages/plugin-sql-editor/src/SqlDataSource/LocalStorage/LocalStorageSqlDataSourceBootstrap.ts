/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { action, makeObservable, observable } from 'mobx';

import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { SettingsService } from '@cloudbeaver/core-settings';

import { createSqlDataSourceHistoryInitialState } from '../SqlDataSourceHistory/createSqlDataSourceHistoryInitialState';
import { validateSqlDataSourceHistoryState } from '../SqlDataSourceHistory/validateSqlDataSourceHistoryState';
import { ISqlDataSourceOptions, SqlDataSourceService } from '../SqlDataSourceService';
import type { ILocalStorageSqlDataSourceState } from './ILocalStorageSqlDataSourceState';
import { LocalStorageSqlDataSource } from './LocalStorageSqlDataSource';

const localStorageKey = 'local-storage-sql-data-source';

@injectable()
export class LocalStorageSqlDataSourceBootstrap extends Bootstrap {
  private readonly dataSourceStateState = new Map<string, ILocalStorageSqlDataSourceState>();

  constructor(private readonly sqlDataSourceService: SqlDataSourceService, settingsService: SettingsService) {
    super();
    this.dataSourceStateState = new Map();

    makeObservable<this, 'dataSourceStateState' | 'createState'>(this, {
      createState: action,
      dataSourceStateState: observable.deep,
    });

    settingsService.registerSettings(
      localStorageKey,
      this.dataSourceStateState,
      () => new Map(),
      map => {
        try {
          for (const [key, value] of Array.from(map.entries())) {
            if (
              typeof value.script !== 'string' ||
              !['string', 'undefined', 'object'].includes(typeof value.name) ||
              !['undefined', 'object'].includes(typeof value.executionContext) ||
              !['string', 'undefined', 'object'].includes(typeof value.executionContext?.connectionId) ||
              !['string', 'undefined', 'object'].includes(typeof value.executionContext?.id) ||
              !['string', 'undefined', 'object'].includes(typeof value.executionContext?.defaultCatalog) ||
              !['string', 'undefined', 'object'].includes(typeof value.executionContext?.defaultSchema) ||
              !validateSqlDataSourceHistoryState(value.history)
            ) {
              map.delete(key);
            }
          }
        } catch (e) {
          map.clear();
          console.log(e);
        }
        return map;
      },
      this.bindState.bind(this), // we use indexed db, so we don't need to bind state on load
      'indexed',
    );
  }

  register(): void | Promise<void> {
    this.sqlDataSourceService.register({
      key: LocalStorageSqlDataSource.key,
      getDataSource: (editorId, options) => new LocalStorageSqlDataSource(this.createState(editorId, options)),
      onDestroy: (_, editorId) => this.deleteState(editorId),
    });
  }

  load(): void | Promise<void> {}

  private createState(editorId: string, options?: ISqlDataSourceOptions): ILocalStorageSqlDataSourceState {
    let state = this.dataSourceStateState.get(editorId);

    if (!state) {
      state = observable<ILocalStorageSqlDataSourceState>({
        name: options?.name,
        script: options?.script ?? '',
        executionContext: options?.executionContext,
        history: createSqlDataSourceHistoryInitialState(options?.script),
      });

      this.dataSourceStateState.set(editorId, state);
    }

    return state;
  }

  private bindState(): void {
    for (const [editorId, datasource] of this.sqlDataSourceService.dataSources) {
      if (datasource instanceof LocalStorageSqlDataSource) {
        datasource.bindState(this.createState(editorId));
      }
    }
  }

  private deleteState(editorId: string): void {
    this.dataSourceStateState.delete(editorId);
  }
}
