/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { TeamInfoMetaParametersResource, TeamsResource } from '@cloudbeaver/core-authentication';
import { createDataContext, DATA_CONTEXT_DI_PROVIDER } from '@cloudbeaver/core-data-context';
import { LocalizationService } from '@cloudbeaver/core-localization';
import type { IFormState } from '@cloudbeaver/core-ui';

import type { ITeamFormState } from '../TeamsAdministrationFormService.js';
import { TeamOptionsFormPart } from './TeamOptionsFormPart.js';

const DATA_CONTEXT_TEAM_FORM_OPTIONS_PART = createDataContext<TeamOptionsFormPart>('Team Form Options Part');

export function getTeamOptionsFormPart(formState: IFormState<ITeamFormState>): TeamOptionsFormPart {
  return formState.getPart(DATA_CONTEXT_TEAM_FORM_OPTIONS_PART, context => {
    const di = context.get(DATA_CONTEXT_DI_PROVIDER)!;
    const teamsResource = di.getService(TeamsResource);
    const teamsMetaParametersResource = di.getService(TeamInfoMetaParametersResource);
    const localizationService = di.getService(LocalizationService);

    return new TeamOptionsFormPart(formState, teamsResource, teamsMetaParametersResource, localizationService);
  });
}
