/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { uuid } from '@cloudbeaver/core-utils';

import { DatabaseDataAccessMode, IDatabaseDataModel } from './IDatabaseDataModel';
import { IDatabaseDataResult } from './IDatabaseDataResult';
import { IDatabaseDataSource, IRequestInfo } from './IDatabaseDataSource';

export class DatabaseDataModel<TOptions, TResult extends IDatabaseDataResult>
implements IDatabaseDataModel<TOptions, TResult> {
  id: string;
  results: TResult[];
  source: IDatabaseDataSource<TOptions, TResult>;
  access: DatabaseDataAccessMode;

  get requestInfo(): IRequestInfo {
    return this.source.requestInfo;
  }

  constructor(source: IDatabaseDataSource<TOptions, TResult>) {
    this.id = uuid();
    this.source = source;
    this.results = [];
    this.access = DatabaseDataAccessMode.Default;
  }

  isLoading(): boolean {
    return this.source.isLoading();
  }

  setAccess(access: DatabaseDataAccessMode): this {
    this.access = access;
    return this;
  }

  setSlice(offset: number, count: number): this {
    this.source.setSlice(offset, count);
    return this;
  }

  setOptions(options: TOptions): this {
    this.source.setOptions(options);
    return this;
  }

  async requestData(): Promise<void> {
    this.results = await this.source.requestData(this.results);
  }
}
