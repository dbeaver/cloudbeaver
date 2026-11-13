/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { type ServiceType, Context } from '@cloudbeaver/core-di';
import type { DatabaseActionImplementation, IDatabaseDataAction } from './IDatabaseDataAction.js';
import type { IDatabaseDataResult } from './IDatabaseDataResult.js';

export interface IDatabaseDataActions<TOptions, TResult extends IDatabaseDataResult> {
  getConstructor<T extends IDatabaseDataAction<TOptions, TResult>>(service: ServiceType<T>): ServiceType<T>;
  tryGet<T>(result: TResult, action: ServiceType<T>): T | undefined;
  tryGet<T>(result: TResult, action: ServiceType<unknown>, implementation: DatabaseActionImplementation<T>): T | undefined;
  get<T>(result: TResult, action: ServiceType<T>): T;
  get<T>(result: TResult, action: ServiceType<unknown>, implementation: DatabaseActionImplementation<T>): T;

  updateResults(results: TResult[]): this;
  registerAction<T>(service: ServiceType<any>, implementation: ServiceType<T>): this;
  unregisterAction<T>(service: ServiceType<any>, implementation: ServiceType<T>): void;
}

export const IDatabaseDataActions = Context.Service<IDatabaseDataActions<any, any>>(
  '@cloudbeaver/plugin-data-viewer/DatabaseDataModel/IDatabaseDataActions#IDatabaseDataActions',
);
