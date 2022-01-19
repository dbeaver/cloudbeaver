/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useState } from 'react';

import type { RoleInfo } from '@cloudbeaver/core-authentication';
import { useService } from '@cloudbeaver/core-di';
import type { CachedMapResource } from '@cloudbeaver/core-sdk';

import type { IRoleFormState } from './IRoleFormProps';
import { RoleFormService } from './RoleFormService';
import { RoleFormState } from './RoleFormState';

export function useRoleFormState(
  resource: CachedMapResource<string, RoleInfo>,
  configure?: (state: IRoleFormState) => any
): IRoleFormState {
  const service = useService(RoleFormService);
  const [state] = useState<IRoleFormState>(() => {
    const state = new RoleFormState(
      service,
      resource,
    );
    configure?.(state);

    state.load();
    return state;
  });

  return state;
}
