/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { createExtension, isExtension, IExtension } from '@cloudbeaver/core-extensions';

const objectSchemaSetterSymbol = Symbol('@extension/ObjectSchemaSetter');

export type IObjectSchemaSetter<T = never> = (schemaId: string, context: T) => Promise<boolean> | boolean;

export function objectSchemaSetter<T>(provider: IObjectSchemaSetter<T>) {
  return createExtension<T>(provider, objectSchemaSetterSymbol);
}

export function isObjectSchemaSetter<T>(obj: IExtension<T>): obj is IObjectSchemaSetter<T> & IExtension<T> {
  return isExtension(obj, objectSchemaSetterSymbol) as boolean;
}
