/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { DatabaseConnection } from '@cloudbeaver/core-connections';
import type { CachedResourceIncludeArgs } from '@cloudbeaver/core-resource';
import type { GetUserConnectionsQueryVariables } from '@cloudbeaver/core-sdk';

export type ConnectionFormInfoIncludes = CachedResourceIncludeArgs<DatabaseConnection, GetUserConnectionsQueryVariables>;

export interface IConnectionFormConfigureContext {
  readonly connectionIncludes: ConnectionFormInfoIncludes;

  include: (...includes: ConnectionFormInfoIncludes) => any;
}

export function connectionFormConfigureContext(): IConnectionFormConfigureContext {
  return {
    connectionIncludes: [],
    include(...includes) {
      const includedSet = new Set(this.connectionIncludes);

      for (const include of includes) {
        if (!includedSet.has(include as never)) {
          this.connectionIncludes.push(include as never);
        }
      }
    },
  };
}
