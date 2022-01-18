/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { createExtension, isExtension, IExtension } from '@cloudbeaver/core-extensions';

const connectionProviderSymbol = Symbol('@extension/ConnectionProvider');

export type IConnectionProvider<T = never> = (context: T) => string | undefined;

export function connectionProvider<T>(provider: IConnectionProvider<T>) {
  return createExtension<T>(provider, connectionProviderSymbol);
}

export function isConnectionProvider<T>(obj: IExtension<T>): obj is IConnectionProvider<T> & IExtension<T> {
  return isExtension(obj, connectionProviderSymbol);
}
