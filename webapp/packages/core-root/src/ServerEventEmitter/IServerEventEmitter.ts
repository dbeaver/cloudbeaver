/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { Observable } from 'rxjs';

import type { ISyncExecutor } from '@cloudbeaver/core-executor';

export type IServerEventCallback<T> = (data: T) => any;
export type Unsubscribe = () => void;

export interface IBaseServerEvent<TID extends string = string, TTopic extends string = string> {
  id: TID;
  topicId?: TTopic;
}

export interface IServerEventEmitter<
  TEvent extends IBaseServerEvent<TEventID, TTopic>,
  TSourceEvent extends IBaseServerEvent<TEventID, TTopic> = TEvent,
  TEventID extends string = string,
  TTopic extends string = string,
> {
  readonly onInit: ISyncExecutor;

  onEvent<T = TEvent>(id: TEventID, callback: IServerEventCallback<T>, mapTo?: (event: TEvent) => T): Unsubscribe;

  on<T = TEvent>(callback: IServerEventCallback<T>, mapTo?: (event: TEvent) => T, filter?: (event: TEvent) => boolean): Unsubscribe;

  multiplex<T = TEvent>(topicId: TTopic, mapTo?: (event: TEvent) => T): Observable<T>;

  emit(event: TSourceEvent): this;
}
