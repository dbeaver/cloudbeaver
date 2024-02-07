/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

export interface IDatabaseDataCacheAction<TKey> {
  has(key: TKey, scope: symbol): boolean;
  get<T>(key: TKey, scope: symbol): T | undefined;
  set<T>(key: TKey, value: T, scope: symbol): void;
  delete(key: TKey, scope: symbol): void;
}
