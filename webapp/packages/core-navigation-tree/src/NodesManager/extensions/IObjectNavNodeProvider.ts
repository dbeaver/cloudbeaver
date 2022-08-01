/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { createExtension, isExtension, IExtension } from '@cloudbeaver/core-extensions';

import type { IDataContextActiveNode } from '../DATA_CONTEXT_ACTIVE_NODE';

const objectNavNodeProviderSymbol = Symbol('@extension/ObjectNavNodeProvider');

export type IObjectNavNodeProvider<T = never> = (context: T) => IDataContextActiveNode | undefined;

export function objectNavNodeProvider<T>(provider: IObjectNavNodeProvider<T>) {
  return createExtension<T>(provider, objectNavNodeProviderSymbol);
}

export function isObjectNavNodeProvider<T>(obj: IExtension<T>): obj is IObjectNavNodeProvider<T> & IExtension<T> {
  return isExtension(obj, objectNavNodeProviderSymbol);
}
