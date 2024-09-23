/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { useState } from 'react';

import type { TeamInfoMetaParametersResource, TeamsResource } from '@cloudbeaver/core-authentication';
import { useService } from '@cloudbeaver/core-di';

import type { ITeamFormState } from './ITeamFormProps.js';
import { TeamFormService } from './TeamFormService.js';
import { TeamFormState } from './TeamFormState.js';

export function useTeamFormState(
  resource: TeamsResource,
  teamInfoMetaParametersResource: TeamInfoMetaParametersResource,
  configure?: (state: ITeamFormState) => any,
): ITeamFormState {
  const service = useService(TeamFormService);
  const [state] = useState<ITeamFormState>(() => {
    const state = new TeamFormState(service, resource, teamInfoMetaParametersResource);
    configure?.(state);

    state.load();
    return state;
  });

  return state;
}
