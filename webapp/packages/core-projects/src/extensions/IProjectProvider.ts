/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { createExtension, type IExtension, isExtension } from '@cloudbeaver/core-extensions';

const projectProviderSymbol = Symbol('@extension/ProjectProvider');

export type IProjectProvider<T = never> = (context: T) => string | undefined;

export function projectProvider<T>(provider: IProjectProvider<T>) {
  return createExtension<T>(provider, projectProviderSymbol);
}

export function isProjectProvider<T>(obj: IExtension<T>): obj is IProjectProvider<T> & IExtension<T> {
  return isExtension(obj, projectProviderSymbol);
}
