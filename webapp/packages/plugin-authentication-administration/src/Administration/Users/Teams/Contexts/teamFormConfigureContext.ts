/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { TeamInfo } from '@cloudbeaver/core-authentication';
import type { IExecutionContextProvider } from '@cloudbeaver/core-executor';

import type { ITeamFormState } from '../ITeamFormProps';

export interface ITeamFormConfigureContext {
  readonly info: TeamInfo | undefined;
}

export function teamFormConfigureContext(contexts: IExecutionContextProvider<ITeamFormState>, state: ITeamFormState): ITeamFormConfigureContext {
  return {
    info: state.info,
  };
}
