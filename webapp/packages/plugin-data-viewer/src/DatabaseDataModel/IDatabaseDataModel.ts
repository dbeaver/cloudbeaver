/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { IDatabaseDataResult } from './IDatabaseDataResult';
import { IDatabaseDataSource, IRequestInfo } from './IDatabaseDataSource';

export enum DatabaseDataAccessMode {
  Default,
  Readonly
}

export interface IDatabaseDataModel<TOptions, TResult extends IDatabaseDataResult> {
  readonly id: string;
  readonly results: TResult[];
  readonly source: IDatabaseDataSource<TOptions, TResult>;
  readonly access: DatabaseDataAccessMode;
  readonly requestInfo: IRequestInfo;

  isLoading(): boolean;
  setAccess(access: DatabaseDataAccessMode): this;
  setSlice(offset: number, count: number): this;
  setOptions(options: TOptions): this;
  requestData(): Promise<void>;
}
