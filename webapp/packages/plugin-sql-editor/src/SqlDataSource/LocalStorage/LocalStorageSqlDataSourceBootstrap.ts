/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { action, makeObservable, observable } from 'mobx';

import { Bootstrap, Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import { StorageService } from '@cloudbeaver/core-storage';

import { createSqlDataSourceHistoryInitialState } from '../SqlDataSourceHistory/createSqlDataSourceHistoryInitialState.js';
import { validateSqlDataSourceHistoryState } from '../SqlDataSourceHistory/validateSqlDataSourceHistoryState.js';
import { type ISqlDataSourceOptions, SqlDataSourceService } from '../SqlDataSourceService.js';
import type { ILocalStorageSqlDataSourceState } from './ILocalStorageSqlDataSourceState.js';
import { LocalStorageSqlDataSource } from './LocalStorageSqlDataSource.js';

const localStorageKey = 'local-storage-sql-data-source';

export class LocalStorageSqlDataSourceBootstrapImpl extends Bootstrap {
  private readonly dataSourceStateState = new Map<string, ILocalStorageSqlDataSourceState>();

  constructor(
    private readonly sqlDataSourceService: SqlDataSourceService,
    storageService: StorageService,
  ) {
    super();
    this.dataSourceStateState = new Map();

    makeObservable<this, 'dataSourceStateState' | 'createState'>(this, {
      createState: action,
      dataSourceStateState: observable.deep,
    });

    storageService.registerSettings(
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

  override register(): void | Promise<void> {
    this.sqlDataSourceService.register({
      key: LocalStorageSqlDataSource.key,
      getDataSource: (editorId, options) => new LocalStorageSqlDataSource(this.createState(editorId, options)),
      onDestroy: (_, editorId) => this.deleteState(editorId),
    });
  }

  private createState(editorId: string, options?: ISqlDataSourceOptions): ILocalStorageSqlDataSourceState {
    let state = this.dataSourceStateState.get(editorId);

    if (!state) {
      state = observable<ILocalStorageSqlDataSourceState>({
        name: options?.name,
        script: options?.script ?? '',
        executionContext: options?.executionContext,
        history: createSqlDataSourceHistoryInitialState(options?.script),
        ...options?.dataSourceState,
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

export type LocalStorageSqlDataSourceBootstrap = LocalStorageSqlDataSourceBootstrapImpl;

export class LocalStorageSqlDataSourceBootstrapDI extends Context.Service<
  LocalStorageSqlDataSourceBootstrapDI,
  LocalStorageSqlDataSourceBootstrapImpl
>()('@cloudbeaver/plugin-sql-editor/SqlDataSource/LocalStorage/LocalStorageSqlDataSourceBootstrap#LocalStorageSqlDataSourceBootstrap') {
  static readonly implementation = LocalStorageSqlDataSourceBootstrapImpl;

  static readonly dependencies = () => [SqlDataSourceService, StorageService] as const;
  static readonly make: Effect.Effect<
    LocalStorageSqlDataSourceBootstrapImpl,
    never,
    Context.Service.Identifier<typeof SqlDataSourceService> | Context.Service.Identifier<typeof StorageService>
  > = Effect.gen(function* makeLocalStorageSqlDataSourceBootstrap() {
    const sqlDataSourceService = yield* SqlDataSourceService;
    const storageService = yield* StorageService;

    return new LocalStorageSqlDataSourceBootstrapImpl(sqlDataSourceService, storageService);
  });
  static readonly layer: Layer.Layer<
    LocalStorageSqlDataSourceBootstrapDI,
    never,
    Context.Service.Identifier<typeof SqlDataSourceService> | Context.Service.Identifier<typeof StorageService>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const LocalStorageSqlDataSourceBootstrap = LocalStorageSqlDataSourceBootstrapDI;
