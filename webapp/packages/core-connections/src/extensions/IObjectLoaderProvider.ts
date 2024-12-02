/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { createExtension, type IExtension, isExtension } from '@cloudbeaver/core-extensions';
import type { ILoadableState } from '@cloudbeaver/core-utils';

const objectLoaderProviderSymbol = Symbol('@extension/ObjectLoaderProvider');

export type IObjectLoaderProvider<T = never> = (context: T) => ILoadableState[];

export function objectLoaderProvider<T>(provider: IObjectLoaderProvider<T>) {
  return createExtension<T>(provider, objectLoaderProviderSymbol);
}

export function isObjectLoaderProvider<T>(obj: IExtension<T>): obj is IObjectLoaderProvider<T> & IExtension<T> {
  return isExtension(obj, objectLoaderProviderSymbol);
}
