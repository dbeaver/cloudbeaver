/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { Observable } from 'rxjs';

import type { ISyncExecutor } from '@cloudbeaver/core-executor';

export type IServerEventCallback<T> = (data: T) => any;
export type Subscription = () => void;

export interface IServerEventEmitter<TEvent, TSourceEvent = TEvent> {
  readonly onInit: ISyncExecutor;
  on<T = TEvent>(
    callback: IServerEventCallback<T>,
    mapTo?: (event: TEvent) => T,
    filter?: (event: TEvent) => boolean,
  ): Subscription;
  multiplex<T = TEvent>(
    topic: string,
    mapTo?: (event: TEvent) => T,
  ): Observable<T>;
  emit(event: TSourceEvent): this;
}