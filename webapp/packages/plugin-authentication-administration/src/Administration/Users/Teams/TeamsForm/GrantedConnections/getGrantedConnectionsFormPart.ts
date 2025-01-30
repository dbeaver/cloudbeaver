/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { TeamsResource } from '@cloudbeaver/core-authentication';
import { createDataContext, DATA_CONTEXT_DI_PROVIDER } from '@cloudbeaver/core-data-context';
import { ProjectInfoResource } from '@cloudbeaver/core-projects';
import { GraphQLService } from '@cloudbeaver/core-sdk';
import type { IFormState } from '@cloudbeaver/core-ui';

import type { ITeamFormState } from '../TeamsAdministrationFormService.js';
import { GrantedConnectionsFormPart } from './GrantedConnectionsFormPart.js';

const DATA_CONTEXT_TEAM_FORM_CONNECTION_ACCESS_PART = createDataContext<GrantedConnectionsFormPart>('Team Form Connection Access Part');

export function getGrantedConnectionsFormPart(formState: IFormState<ITeamFormState>): GrantedConnectionsFormPart {
  return formState.getPart(DATA_CONTEXT_TEAM_FORM_CONNECTION_ACCESS_PART, context => {
    const di = context.get(DATA_CONTEXT_DI_PROVIDER)!;
    const projectInfoResource = di.getService(ProjectInfoResource);
    const teamsResource = di.getService(TeamsResource);
    const graphQLService = di.getService(GraphQLService);

    return new GrantedConnectionsFormPart(formState, projectInfoResource, teamsResource, graphQLService);
  });
}
