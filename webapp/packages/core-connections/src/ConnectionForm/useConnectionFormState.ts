/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useEffect, useState } from 'react';

import { useService } from '@cloudbeaver/core-di';
import type { CachedMapResource, GetConnectionsQueryVariables } from '@cloudbeaver/core-sdk';

import type { DatabaseConnection } from '../Administration/ConnectionsResource';
import { ConnectionFormService } from './ConnectionFormService';
import { ConnectionFormState } from './ConnectionFormState';
import type { IConnectionFormState } from './IConnectionFormProps';

export function useConnectionFormState(
  resource: CachedMapResource<string, DatabaseConnection, GetConnectionsQueryVariables>,
  configure?: (state: IConnectionFormState) => any
): IConnectionFormState {
  const service = useService(ConnectionFormService);
  const [state] = useState<IConnectionFormState>(() => {
    const state = new ConnectionFormState(
      service,
      resource,
    );
    configure?.(state);

    state.load();
    return state;
  });

  useEffect(() => () => state.dispose(), []);

  return state;
}
