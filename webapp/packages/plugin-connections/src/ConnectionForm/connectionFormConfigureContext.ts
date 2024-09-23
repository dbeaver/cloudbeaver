/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { DatabaseConnection } from '@cloudbeaver/core-connections';
import type { IExecutionContextProvider } from '@cloudbeaver/core-executor';
import type { CachedResourceIncludeArgs } from '@cloudbeaver/core-resource';
import type { GetUserConnectionsQueryVariables } from '@cloudbeaver/core-sdk';

import type { IConnectionFormState } from './IConnectionFormProps.js';

export type ConnectionFormInfoIncludes = CachedResourceIncludeArgs<DatabaseConnection, GetUserConnectionsQueryVariables>;

export interface IConnectionFormConfigureContext {
  readonly driverId: string | undefined;
  readonly info: DatabaseConnection | undefined;
  readonly connectionIncludes: ConnectionFormInfoIncludes;

  include: (...includes: ConnectionFormInfoIncludes) => any;
}

export function connectionFormConfigureContext(
  contexts: IExecutionContextProvider<IConnectionFormState>,
  state: IConnectionFormState,
): IConnectionFormConfigureContext {
  return {
    info: state.info,
    driverId: state.config.driverId,
    connectionIncludes: [],
    include(...includes) {
      for (const include of includes) {
        if (!this.connectionIncludes.includes(include as never)) {
          this.connectionIncludes.push(include as never);
        }
      }
    },
  };
}
