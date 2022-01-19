/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

interface IConnectionCredentialsState {
  authModelId: string | null;
  networkHandlers: string[];
}

interface IConnectionCredentialsStateContext extends IConnectionCredentialsState {
  requireAuthModel: (id: string) => void;
  requireNetworkHandler: (id: string) => void;
}

export function connectionCredentialsStateContext(): IConnectionCredentialsStateContext {
  return {
    authModelId: null,
    networkHandlers: [],
    requireAuthModel(id) {
      this.authModelId = id;
    },
    requireNetworkHandler(id) {
      this.networkHandlers.push(id);
    },
  };
}
