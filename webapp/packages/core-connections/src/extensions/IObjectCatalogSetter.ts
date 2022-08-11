/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { createExtension, isExtension, IExtension } from '@cloudbeaver/core-extensions';

const objectCatalogSetterSymbol = Symbol('@extension/ObjectCatalogSetter');

export type IObjectCatalogSetter<T = never> = (catalogId: string, context: T) => Promise<boolean> | boolean;

export function objectCatalogSetter<T>(provider: IObjectCatalogSetter<T>) {
  return createExtension<T>(provider, objectCatalogSetterSymbol);
}

export function isObjectCatalogSetter<T>(obj: IExtension<T>): obj is IObjectCatalogSetter<T> & IExtension<T> {
  return isExtension(obj, objectCatalogSetterSymbol) as boolean;
}
