/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { createExtension, isExtension, IExtension } from '@cloudbeaver/core-extensions';

const objectCatalogProviderSymbol = Symbol('@extension/ObjectCatalogProvider');

export type IObjectCatalogProvider<T = never> = (context: T) => string | undefined;

export function objectCatalogProvider<T>(provider: IObjectCatalogProvider<T>) {
  return createExtension<T>(provider, objectCatalogProviderSymbol);
}

export function isObjectCatalogProvider<T>(obj: IExtension<T>): obj is IObjectCatalogProvider<T> & IExtension<T> {
  return isExtension(obj, objectCatalogProviderSymbol);
}
