/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { ValueToken } from './InjectionToken';
import { ITypedConstructor } from './ITypedConstructor';

export interface IServiceCollection {
  addServiceByToken<T extends object>(token: any, value: T): void;
  addServiceByClass(ctor: IServiceConstructor<any>): void;
}

export type ExtractInitArgs<T> = T extends IInitializableController<infer TArgs>? TArgs : never;

export interface IDestructibleController {
  destruct(): void;
}

export interface IInitializableController<TArgs extends any[] = any[]> {
  init(...args: TArgs): void;
}

export interface IServiceConstructor<T> extends ITypedConstructor<T> {
}

export interface IServiceInjector {
  getServiceByClass<T>(ctor: IServiceConstructor<T>): T;
  getServiceByToken<T>(token: ValueToken<T>): T;
  resolveServiceByClass<T>(ctor: IServiceConstructor<T>): T;
}
