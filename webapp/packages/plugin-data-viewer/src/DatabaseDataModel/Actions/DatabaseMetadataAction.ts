/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { ResultDataFormat } from '@cloudbeaver/core-sdk';
import { MetadataMap } from '@cloudbeaver/core-utils';

import { DatabaseDataAction } from '../DatabaseDataAction';
import type { IDatabaseDataResult } from '../IDatabaseDataResult';
import type { IDatabaseDataSource } from '../IDatabaseDataSource';
import { databaseDataAction } from './DatabaseDataActionDecorator';
import type { IDatabaseDataMetadataAction } from './IDatabaseDataMetadataAction';

@databaseDataAction()
export class DatabaseMetadataAction<TKey, TResult extends IDatabaseDataResult>
  extends DatabaseDataAction<any, TResult>
  implements IDatabaseDataMetadataAction<TKey, TResult>
{
  static dataFormat: ResultDataFormat[] | null = null;
  readonly metadata: MetadataMap<string, any>;

  constructor(source: IDatabaseDataSource<any, TResult>) {
    super(source);
    this.metadata = new MetadataMap();
  }

  has(key: string): boolean {
    return this.metadata.has(key);
  }

  get<T>(key: string): T | undefined;
  get<T>(key: string, getDefaultValue: (() => T) | undefined): T;
  get<T>(key: string, getDefaultValue?: (() => T) | undefined): T | undefined {
    return this.metadata.get(key, getDefaultValue);
  }

  set(key: string, value: any): void {
    this.metadata.set(key, value);
  }

  delete(key: string): void {
    this.metadata.delete(key);
  }
}
