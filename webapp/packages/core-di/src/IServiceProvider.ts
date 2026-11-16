/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Context, type Effect } from 'effect';

import type { ServiceType } from './Service.js';

export interface IServiceScope extends AsyncDisposable, Disposable {
  readonly serviceProvider: IServiceProvider;
}

export interface IServiceScopeOptions {
  readonly context?: Context.Context<any>;
  readonly aliases?: ReadonlyMap<string, ServiceType> | (() => ReadonlyMap<string, ServiceType>);
}

/** A synchronous view over acquired Effect services, not a constructor resolver. */
export interface IServiceProvider {
  getService<T>(key: ServiceType<T>): T;
  acquireService<T>(key: ServiceType<T>, context?: Context.Context<any>): T;
  acquireServiceAsync<T>(key: ServiceType<T>, context?: Context.Context<any>): Promise<T>;
  createScope(options?: IServiceScopeOptions): IServiceScope;
  runPromise<A, E, R>(effect: Effect.Effect<A, E, R>): Promise<A>;
}

export const IServiceProvider = Context.Service<IServiceProvider>('@cloudbeaver/core-di/IServiceProvider');
