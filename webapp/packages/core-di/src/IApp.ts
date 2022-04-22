/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { ValueToken } from './InjectionToken';
import type { ITypedConstructor } from './ITypedConstructor';

export interface IServiceCollection {
  addServiceByToken: <T extends Record<string, any>>(token: any, value: T) => void;
  addServiceByClass: (ctor: IServiceConstructor<any>, value?: any) => void;
}

export type ExtractInitArgs<T> = T extends IInitializableController<infer TArgs>? TArgs : never;

export interface IDestructibleController {
  destruct: () => void;
}

export interface IInitializableController<TArgs extends any[] = any[]> {
  init: (...args: TArgs) => void;
}

export type IServiceConstructor<T> = ITypedConstructor<T>;

export interface IServiceInjector {
  getServiceByClass: <T>(ctor: IServiceConstructor<T>) => T;
  getServiceByToken: <T>(token: ValueToken<T>) => T;
  resolveServiceByClass: <T>(ctor: IServiceConstructor<T>) => T;
}
