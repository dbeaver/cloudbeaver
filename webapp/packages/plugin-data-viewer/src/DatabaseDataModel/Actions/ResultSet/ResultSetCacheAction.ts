/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { action, makeObservable, observable } from 'mobx';

import { ResultDataFormat } from '@cloudbeaver/core-sdk';

import { DatabaseDataAction } from '../../DatabaseDataAction.js';
import type { IDatabaseDataSource } from '../../IDatabaseDataSource.js';
import type { IDatabaseResultSet } from '../../IDatabaseResultSet.js';
import { databaseDataAction } from '../DatabaseDataActionDecorator.js';
import type { IDatabaseDataCacheAction } from '../IDatabaseDataCacheAction.js';
import type { IResultSetElementKey, IResultSetRowKey } from './IResultSetDataKey.js';
import { ResultSetDataAction } from './ResultSetDataAction.js';

@databaseDataAction()
export class ResultSetCacheAction
  extends DatabaseDataAction<any, IDatabaseResultSet>
  implements IDatabaseDataCacheAction<IResultSetElementKey, IDatabaseResultSet>
{
  static dataFormat = [ResultDataFormat.Resultset];

  private readonly cache: Map<string, Map<symbol, any>>;

  constructor(
    source: IDatabaseDataSource<any, IDatabaseResultSet>,
    private readonly data: ResultSetDataAction,
  ) {
    super(source);

    this.cache = new Map();

    makeObservable<this, 'cache'>(this, {
      cache: observable,
      set: action,
      setRow: action,
      delete: action,
      deleteAll: action,
      deleteRow: action,
    });
  }

  get<T>(key: IResultSetElementKey, scope: symbol): T | undefined {
    const keyCache = this.getKeyCache(key);
    if (!keyCache) {
      return;
    }

    return keyCache.get(scope);
  }

  getRow<T>(key: IResultSetRowKey, scope: symbol): T | undefined {
    const keyCache = this.getRowCache(key);
    if (!keyCache) {
      return;
    }

    return keyCache.get(scope);
  }

  has(key: IResultSetElementKey, scope: symbol) {
    const keyCache = this.getKeyCache(key);

    if (!keyCache) {
      return false;
    }

    return keyCache.has(scope);
  }

  hasRow(key: IResultSetRowKey, scope: symbol) {
    const keyCache = this.getRowCache(key);

    if (!keyCache) {
      return false;
    }

    return keyCache.has(scope);
  }

  set<T>(key: IResultSetElementKey, scope: symbol, value: T) {
    const keyCache = this.getOrCreateKeyCache(key);

    keyCache.set(scope, value);
  }

  setRow<T>(key: IResultSetRowKey, scope: symbol, value: T) {
    const keyCache = this.getOrCreateRowKeyCache(key);

    keyCache.set(scope, value);
  }

  delete(key: IResultSetElementKey, scope: symbol) {
    const keyCache = this.getKeyCache(key);

    if (keyCache) {
      keyCache.delete(scope);
    }
  }

  deleteAll(scope: symbol) {
    for (const [, keyCache] of this.cache) {
      keyCache.delete(scope);
    }
  }

  deleteRow(key: IResultSetRowKey, scope: symbol) {
    const keyCache = this.getRowCache(key);

    if (keyCache) {
      keyCache.delete(scope);
    }
  }

  override afterResultUpdate() {
    this.cache.clear();
  }

  override dispose(): void {
    this.cache.clear();
  }

  private serializeRowKey(key: IResultSetRowKey) {
    return 'row:' + this.data.serializeRowKey(key);
  }

  private serializeKey(key: IResultSetElementKey) {
    return this.data.serialize(key);
  }

  private getKeyCache(key: IResultSetElementKey) {
    return this.cache.get(this.serializeKey(key));
  }

  private getRowCache(key: IResultSetRowKey) {
    return this.cache.get(this.serializeRowKey(key));
  }

  private getOrCreateKeyCache(key: IResultSetElementKey) {
    let keyCache = this.getKeyCache(key);

    if (!keyCache) {
      keyCache = observable(new Map());
      this.cache.set(this.serializeKey(key), keyCache);
    }

    return keyCache;
  }

  private getOrCreateRowKeyCache(key: IResultSetRowKey) {
    let keyCache = this.getRowCache(key);

    if (!keyCache) {
      keyCache = observable(new Map());
      this.cache.set(this.serializeRowKey(key), keyCache);
    }

    return keyCache;
  }
}
