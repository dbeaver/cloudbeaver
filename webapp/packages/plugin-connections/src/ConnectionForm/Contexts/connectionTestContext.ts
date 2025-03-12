/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

export interface IConnectionTestContext {
  clientVersion: string | undefined;
  serverVersion: string | undefined;
  connectTime: string | undefined;
}

export function connectionTestContext(): IConnectionTestContext {
  return {
    clientVersion: undefined,
    serverVersion: undefined,
    connectTime: undefined,
  };
}
