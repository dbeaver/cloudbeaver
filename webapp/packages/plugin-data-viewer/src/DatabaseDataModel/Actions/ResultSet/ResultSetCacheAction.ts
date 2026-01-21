/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { action, makeObservable, observable } from 'mobx';

import { ResultDataFormat } from '@cloudbeaver/core-sdk';

import { DatabaseDataAction } from '../../DatabaseDataAction.js';
import { IDatabaseDataSource } from '../../IDatabaseDataSource.js';
import type { IDatabaseResultSet } from '../../IDatabaseResultSet.js';
import type { IDatabaseDataCacheAction } from '../IDatabaseDataCacheAction.js';
import { ResultSetDataAction } from './ResultSetDataAction.js';
import { injectable } from '@cloudbeaver/core-di';
import { IDatabaseDataResult } from '../../IDatabaseDataResult.js';
import type { IGridColumnKey, IGridDataKey, IGridRowKey } from '../Grid/IGridDataKey.js';

@injectable(() => [IDatabaseDataSource, IDatabaseDataResult, ResultSetDataAction])
export class ResultSetCacheAction
  extends DatabaseDataAction<any, IDatabaseResultSet>
  implements IDatabaseDataCacheAction<IGridDataKey, IDatabaseResultSet>
{
  static dataFormat = [ResultDataFormat.Resultset];

  private readonly cache: Map<string, Map<symbol, any>>;

  constructor(
    source: IDatabaseDataSource,
    result: IDatabaseDataResult,
    private readonly data: ResultSetDataAction,
  ) {
    super(source as unknown as IDatabaseDataSource<unknown, IDatabaseResultSet>, result as IDatabaseResultSet);

    this.cache = new Map();

    makeObservable<this, 'cache'>(this, {
      cache: observable,
      set: action,
      setRow: action,
      setColumn: action,
      delete: action,
      deleteAll: action,
      deleteRow: action,
      deleteColumn: action,
    });
  }

  get<T>(key: IGridDataKey, scope: symbol): T | undefined {
    const keyCache = this.getKeyCache(key);
    if (!keyCache) {
      return;
    }

    return keyCache.get(scope);
  }

  getRow<T>(key: IGridRowKey, scope: symbol): T | undefined {
    const keyCache = this.getRowCache(key);
    if (!keyCache) {
      return;
    }

    return keyCache.get(scope);
  }

  getColumn<T>(key: IGridColumnKey, scope: symbol): T | undefined {
    const keyCache = this.getColumnCache(key);
    if (!keyCache) {
      return;
    }

    return keyCache.get(scope);
  }

  has(key: IGridDataKey, scope: symbol): boolean {
    const keyCache = this.getKeyCache(key);

    if (!keyCache) {
      return false;
    }

    return keyCache.has(scope);
  }

  hasRow(key: IGridRowKey, scope: symbol): boolean {
    const keyCache = this.getRowCache(key);

    if (!keyCache) {
      return false;
    }

    return keyCache.has(scope);
  }

  hasColumn(key: IGridColumnKey, scope: symbol): boolean {
    const keyCache = this.getColumnCache(key);

    if (!keyCache) {
      return false;
    }

    return keyCache.has(scope);
  }

  set<T>(key: IGridDataKey, scope: symbol, value: T): void {
    const keyCache = this.getOrCreateKeyCache(key);

    keyCache.set(scope, value);
  }

  setRow<T>(key: IGridRowKey, scope: symbol, value: T): void {
    const keyCache = this.getOrCreateRowKeyCache(key);

    keyCache.set(scope, value);
  }

  setColumn<T>(key: IGridColumnKey, scope: symbol, value: T): void {
    const keyCache = this.getOrCreateColumnKeyCache(key);

    keyCache.set(scope, value);
  }

  delete(key: IGridDataKey, scope: symbol): void {
    const keyCache = this.getKeyCache(key);

    if (keyCache) {
      keyCache.delete(scope);
    }
  }

  deleteAll(scope: symbol): void {
    for (const [, keyCache] of this.cache) {
      keyCache.delete(scope);
    }
  }

  deleteRow(key: IGridRowKey, scope: symbol): void {
    const keyCache = this.getRowCache(key);

    if (keyCache) {
      keyCache.delete(scope);
    }
  }

  deleteColumn(key: IGridColumnKey, scope: symbol): void {
    const keyCache = this.getColumnCache(key);

    if (keyCache) {
      keyCache.delete(scope);
    }
  }

  override afterResultUpdate(): void {
    this.cache.clear();
  }

  override dispose(): void {
    this.cache.clear();
  }

  private serializeRowKey(key: IGridRowKey) {
    return 'row:' + this.data.serializeRowKey(key);
  }

  private serializeColumnKey(key: IGridColumnKey) {
    return 'col:' + key.index;
  }

  private serializeKey(key: IGridDataKey) {
    return this.data.serialize(key);
  }

  private getKeyCache(key: IGridDataKey) {
    return this.cache.get(this.serializeKey(key));
  }

  private getRowCache(key: IGridRowKey) {
    return this.cache.get(this.serializeRowKey(key));
  }

  private getColumnCache(key: IGridColumnKey) {
    return this.cache.get(this.serializeColumnKey(key));
  }

  private getOrCreateKeyCache(key: IGridDataKey) {
    let keyCache = this.getKeyCache(key);

    if (!keyCache) {
      keyCache = observable(new Map());
      this.cache.set(this.serializeKey(key), keyCache);
    }

    return keyCache;
  }

  private getOrCreateRowKeyCache(key: IGridRowKey) {
    let keyCache = this.getRowCache(key);

    if (!keyCache) {
      keyCache = observable(new Map());
      this.cache.set(this.serializeRowKey(key), keyCache);
    }

    return keyCache;
  }

  private getOrCreateColumnKeyCache(key: IGridColumnKey) {
    let keyCache = this.getColumnCache(key);

    if (!keyCache) {
      keyCache = observable(new Map());
      this.cache.set(this.serializeColumnKey(key), keyCache);
    }

    return keyCache;
  }
}
