/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { makeObservable, observable } from 'mobx';

import { ResultDataFormat } from '@cloudbeaver/core-sdk';

import { DatabaseDataAction } from '../DatabaseDataAction';
import type { IDatabaseDataSource } from '../IDatabaseDataSource';
import type { IDatabaseResultSet } from '../IDatabaseResultSet';
import { databaseDataAction } from './DatabaseDataActionDecorator';
import type { IResultSetCacheAction } from './IResultSetCacheAction';
import { ResultSetDataKeysUtils, type SerializableKey } from './ResultSet/ResultSetDataKeysUtils';

@databaseDataAction()
export class ResultSetCacheAction extends DatabaseDataAction<any, IDatabaseResultSet> implements IResultSetCacheAction {
  static dataFormat = [ResultDataFormat.Resultset];

  private readonly cache: Map<string, Map<string, any>>;

  constructor(source: IDatabaseDataSource<any, IDatabaseResultSet>) {
    super(source);

    this.cache = new Map();

    makeObservable<this, 'cache'>(this, {
      cache: observable,
    });
  }

  get<T>(key: SerializableKey, scope: string): T | undefined {
    const hash = this.getHash(key);
    const scopedCache = this.cache.get(scope);

    if (!scopedCache) {
      return;
    }

    return scopedCache.get(hash);
  }

  has(key: SerializableKey, scope: string) {
    const hash = this.getHash(key);
    const scopedCache = this.cache.get(scope);

    if (!scopedCache) {
      return false;
    }

    return scopedCache.has(hash);
  }

  set<T>(key: SerializableKey, value: T, scope: string) {
    const hash = this.getHash(key);
    let scopedCache = this.cache.get(scope);

    if (!scopedCache) {
      scopedCache = new Map();
      this.cache.set(scope, scopedCache);
    }

    scopedCache.set(hash, value);
  }

  delete(key: SerializableKey, scope: string) {
    const hash = ResultSetDataKeysUtils.serialize(key);
    const scopedCache = this.cache.get(scope);

    if (scopedCache) {
      scopedCache.delete(hash);
    }
  }

  private getHash(key: SerializableKey) {
    return ResultSetDataKeysUtils.serialize(key);
  }
}
