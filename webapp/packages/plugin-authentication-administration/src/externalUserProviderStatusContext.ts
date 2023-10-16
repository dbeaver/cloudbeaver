/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

interface IExternalUserProviderStatusContext {
  externalUserProviderEnabled: boolean;
  setExternalUserProviderStatus(enabled: boolean): void;
}

export function externalUserProviderStatusContext(): IExternalUserProviderStatusContext {
  return {
    externalUserProviderEnabled: false,
    setExternalUserProviderStatus(enabled: boolean) {
      this.externalUserProviderEnabled = enabled;
    },
  };
}
