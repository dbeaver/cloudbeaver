/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { ResultDataFormat } from '@cloudbeaver/core-sdk';

import type { IDatabaseDataResult } from './IDatabaseDataResult';
import type { IDatabaseDataSource } from './IDatabaseDataSource';

type AbstractConstructorFunction<
  TOptions,
  TResult extends IDatabaseDataResult,
  TAction extends IDatabaseDataAction<TOptions, TResult>
> = abstract new (
  source: IDatabaseDataSource<TOptions, TResult>,
  result: TResult,
  ...actions: any[]
) => TAction;

type ConstructorFunction<
  TOptions,
  TResult extends IDatabaseDataResult,
  TAction extends IDatabaseDataAction<TOptions, TResult>
> = new (
  source: IDatabaseDataSource<TOptions, TResult>,
  result: TResult,
  ...actions: any[]
) => TAction;

export type IDatabaseDataActionInterface<
  TOptions,
  TResult extends IDatabaseDataResult,
  TAction extends IDatabaseDataAction<TOptions, TResult>
> = AbstractConstructorFunction<TOptions, TResult, TAction> & {
  dataFormat: ResultDataFormat[] | null;
  prototype: TAction;
};

export type IDatabaseDataActionClass<
  TOptions,
  TResult extends IDatabaseDataResult,
  TAction extends IDatabaseDataAction<TOptions, TResult>
> = ConstructorFunction<TOptions, TResult, TAction> & {
  dataFormat: ResultDataFormat[] | null;
  prototype: TAction;
};

export interface IDatabaseDataAction<TOptions, TResult extends IDatabaseDataResult> {
  readonly source: IDatabaseDataSource<TOptions, TResult>;
  result: TResult;
  resultIndex: number;
  updateResult: (result: TResult) => void;
  updateResults: (results: TResult[]) => void;
  afterResultUpdate: () => void;
  tryGetAction: <T extends IDatabaseDataAction<TOptions, TResult>>(
    action: IDatabaseDataActionClass<TOptions, TResult, T>
  ) => T | undefined;
  getAction: <T extends IDatabaseDataAction<TOptions, TResult>>(
    action: IDatabaseDataActionClass<TOptions, TResult, T>
  ) => T;
  getActionImplementation: <T extends IDatabaseDataAction<TOptions, TResult>>(
    action: IDatabaseDataActionInterface<TOptions, TResult, T>
  ) => T | undefined;
  dispose: () => void;
}
