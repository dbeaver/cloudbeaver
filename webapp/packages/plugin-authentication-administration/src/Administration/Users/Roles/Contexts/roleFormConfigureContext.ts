/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { RoleInfo } from '@cloudbeaver/core-authentication';
import type { IExecutionContextProvider } from '@cloudbeaver/core-executor';

import type { IRoleFormState } from '../IRoleFormProps';

export interface IRoleFormConfigureContext {
  readonly info: RoleInfo | undefined;
}

export function roleFormConfigureContext(
  contexts: IExecutionContextProvider<IRoleFormState>,
  state: IRoleFormState
): IRoleFormConfigureContext {
  return {
    info: state.info,
  };
}
