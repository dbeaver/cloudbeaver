/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { createExtension, type IExtension, isExtension } from '@cloudbeaver/core-extensions';

const connectionRequiredProviderSymbol = Symbol('@extension/ConnectionRequired');

export type IConnectionRequiredProvider<T = never> = (context: T) => boolean | undefined;

export function connectionRequiredProvider<T>(provider: IConnectionRequiredProvider<T>) {
  return createExtension<T>(provider, connectionRequiredProviderSymbol);
}

export function isConnectionRequiredProvider<T>(obj: IExtension<T>): obj is IConnectionRequiredProvider<T> & IExtension<T> {
  return isExtension(obj, connectionRequiredProviderSymbol);
}
