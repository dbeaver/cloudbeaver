/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { ILoadableState } from '@cloudbeaver/core-utils';

interface IExternalUserProviderStatusContext {
  externalUserProviderEnabled: boolean;
  loaders: ILoadableState[];
  setExternalUserProviderStatus(enabled: boolean): void;
  addLoader(loader: ILoadableState): void;
}

export function externalUserProviderStatusContext(): IExternalUserProviderStatusContext {
  return {
    externalUserProviderEnabled: false,
    loaders: [],
    setExternalUserProviderStatus(enabled: boolean) {
      this.externalUserProviderEnabled = enabled;
    },
    addLoader(loader: ILoadableState) {
      this.loaders.push(loader);
    },
  };
}
