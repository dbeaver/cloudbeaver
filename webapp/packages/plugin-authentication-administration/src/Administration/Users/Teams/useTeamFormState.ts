/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { useState } from 'react';

import type { TeamsResource } from '@cloudbeaver/core-authentication';
import { useService } from '@cloudbeaver/core-di';

import type { ITeamFormState } from './ITeamFormProps';
import { TeamFormService } from './TeamFormService';
import { TeamFormState } from './TeamFormState';

export function useTeamFormState(resource: TeamsResource, configure?: (state: ITeamFormState) => any): ITeamFormState {
  const service = useService(TeamFormService);
  const [state] = useState<ITeamFormState>(() => {
    const state = new TeamFormState(service, resource);
    configure?.(state);

    state.load();
    return state;
  });

  return state;
}
