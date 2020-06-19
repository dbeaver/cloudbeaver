/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { createExtension, isExtension, IExtension } from '@cloudbeaver/core-extensions';

const objectSchemaProviderSymbol = Symbol('@extension/ObjectSchemaProvider');

export interface IObjectSchemaProvider<T = never> {
  (context: T): string | undefined;
}

export function objectSchemaProvider<T>(provider: IObjectSchemaProvider<T>) {
  return createExtension<T>(provider, objectSchemaProviderSymbol);
}

export function isObjectSchemaProvider<T>(obj: IExtension<T>): obj is IObjectSchemaProvider<T> & IExtension<T> {
  return isExtension(obj, objectSchemaProviderSymbol);
}
