/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { useEffect, useState } from 'react';

import type { ConnectionInfoResource } from '@cloudbeaver/core-connections';
import { useService } from '@cloudbeaver/core-di';
import { ProjectInfoResource, ProjectsService } from '@cloudbeaver/core-projects';

import { ConnectionFormService } from './ConnectionFormService';
import { ConnectionFormState } from './ConnectionFormState';
import type { IConnectionFormState } from './IConnectionFormProps';

export function useConnectionFormState(resource: ConnectionInfoResource, configure?: (state: IConnectionFormState) => any): IConnectionFormState {
  const projectsService = useService(ProjectsService);
  const projectInfoResource = useService(ProjectInfoResource);

  const service = useService(ConnectionFormService);
  const [state] = useState<IConnectionFormState>(() => {
    const state = new ConnectionFormState(projectsService, projectInfoResource, service, resource);
    configure?.(state);

    state.load();
    return state;
  });

  useEffect(() => () => state.dispose(), []);

  return state;
}
