/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { IExecutor } from '@cloudbeaver/core-executor';
import type { ResultDataFormat } from '@cloudbeaver/core-sdk';

import type { DatabaseDataAccessMode, IDatabaseDataSource, IDatabaseDataSourceOperationEvent, IRequestInfo } from './IDatabaseDataSource.js';

export interface IRequestEventData<TSource extends IDatabaseDataSource<any, any> = IDatabaseDataSource> extends IDatabaseDataSourceOperationEvent {
  model: IDatabaseDataModel<TSource>;
}

/** Represents an interface for interacting with a database. It is used for managing and requesting data. */
export interface IDatabaseDataModel<TSource extends IDatabaseDataSource<any, any> = IDatabaseDataSource> {
  readonly id: string;
  readonly name: string | null;
  readonly source: TSource;
  /** Holds metadata about a data request. */
  readonly requestInfo: IRequestInfo;
  readonly supportedDataFormats: ResultDataFormat[];
  /** Represents the value by which the number of loaded rows will be increased when loading the next data portion */
  readonly countGain: number;

  readonly onOptionsChange: IExecutor;
  readonly onRequest: IExecutor<IRequestEventData<TSource>>;
  readonly onDispose: IExecutor;

  setName: (name: string | null) => this;
  isReadonly: (resultIndex: number) => boolean;
  hasElementIdentifier: (resultIndex: number) => boolean;
  isDisabled: (resultIndex?: number) => boolean;
  isLoading: () => boolean;
  isDataAvailable: (offset: number, count: number) => boolean;

  setAccess: (access: DatabaseDataAccessMode) => this;
  setCountGain: (count: number) => this;
  setSlice: (offset: number, count?: number) => this;
  setDataFormat: (dataFormat: ResultDataFormat) => this;
  setSupportedDataFormats: (dataFormats: ResultDataFormat[]) => this;

  requestOptionsChange: () => Promise<boolean>;
  retry: () => Promise<void>;
  save: () => Promise<void>;
  refresh: () => Promise<void>;
  request: (mutation?: () => void) => Promise<void>;
  reload: () => Promise<void>;
  requestDataPortion: (offset: number, count: number) => Promise<void>;
  cancel: () => Promise<void> | void;
  resetData: () => void;
  dispose: () => Promise<void>;
}
