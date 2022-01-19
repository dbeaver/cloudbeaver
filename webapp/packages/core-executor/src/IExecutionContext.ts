/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

export interface IContextGetter<TData> {
  <T>(token: ISyncContextLoader<T, TData>): T;
  <T>(token: IAsyncContextLoader<T, TData>): Promise<T>;
}

export interface IExecutionContextProvider<TData> {
  hasContext: (token: IContextLoader<any, TData>) => boolean;
  getContext: IContextGetter<TData>;
}

export interface IExecutionContext<TData> extends IExecutionContextProvider<TData> {
  readonly contexts: Map<IContextLoader<any, TData>, any>;
}

export type IAsyncContextLoader<T = any, TData = any> = (
  contexts: IExecutionContextProvider<TData>,
  data: TData
) => Promise<T>;

export type ISyncContextLoader<T = any, TData = any> = (
  contexts: IExecutionContextProvider<TData>,
  data: TData
) => T;

export type IContextLoader<T = any, TData = any> = IAsyncContextLoader<T, TData> | ISyncContextLoader<T, TData>;
