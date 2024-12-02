/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { createExtension, type IExtension, isExtension } from '@cloudbeaver/core-extensions';

const projectSetterStateSymbol = Symbol('@extension/ProjectSetterState');

export type IProjectSetterState<T = never> = (context: T) => Promise<boolean> | boolean;

export function projectSetterState<T>(setter: IProjectSetterState<T>) {
  return createExtension<T>(setter, projectSetterStateSymbol);
}

export function isProjectSetterState<T>(obj: IExtension<T>): obj is IProjectSetterState<T> & IExtension<T> {
  return isExtension(obj, projectSetterStateSymbol);
}
