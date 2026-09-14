/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { ConnectionConfig } from '@cloudbeaver/core-sdk';

export function trimConnectionConfig(state: ConnectionConfig): void {
  state.name = state.name?.trim();
  state.description = state.description?.trim();
  state.url = state.url?.trim();
}
