/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { createExtension, IExtension, isExtension } from '@cloudbeaver/core-extensions';

import type { IConnectionInfoParams } from '../IConnectionsResource';

const connectionSetterSymbol = Symbol('@extension/ConnectionSetter');

export type IConnectionSetter<T = never> = (connectionKey: IConnectionInfoParams, context: T) => Promise<boolean> | boolean;

export function connectionSetter<T>(setter: IConnectionSetter<T>) {
  return createExtension<T>(setter, connectionSetterSymbol);
}

export function isConnectionSetter<T>(obj: IExtension<T>): obj is IConnectionSetter<T> & IExtension<T> {
  return isExtension(obj, connectionSetterSymbol);
}
