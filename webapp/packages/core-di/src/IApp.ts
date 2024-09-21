/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { ITypedConstructor } from './ITypedConstructor.js';

export interface IServiceCollection {
  addServiceByClass: (ctor: IServiceConstructor<any>, value?: any) => void;
  unbindAll: () => void;
}

export type ExtractInitArgs<T> = T extends IInitializableController<infer TArgs> ? TArgs : never;

export interface IDestructibleController {
  destruct: () => void;
}

export interface IInitializableController<TArgs extends any[] = any[]> {
  init: (...args: TArgs) => void;
}

export type IServiceConstructor<T> = ITypedConstructor<T>;

export interface IServiceInjector {
  hasServiceByClass: <T>(ctor: IServiceConstructor<T>) => boolean;
  getServiceByClass: <T>(ctor: IServiceConstructor<T>) => T;
  resolveServiceByClass: <T>(ctor: IServiceConstructor<T>) => T;
}
