/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { createDataContext, DATA_CONTEXT_DI_PROVIDER } from '@cloudbeaver/core-data-context';
import { ProjectInfoResource } from '@cloudbeaver/core-projects';
import type { IFormState } from '@cloudbeaver/core-ui';

import type { IProjectInfoFormState } from '../IProjectInfoFormState.js';
import { ProjectInfoFormOptionsPart } from './ProjectInfoFormOptionsPart.js';

const DATA_CONTEXT_PROJECT_INFO_FORM_OPTIONS_PART = createDataContext<ProjectInfoFormOptionsPart>('project-info-form-options-part');

export function getProjectInfoFormOptionsPart(formState: IFormState<IProjectInfoFormState>): ProjectInfoFormOptionsPart {
  return formState.getPart(DATA_CONTEXT_PROJECT_INFO_FORM_OPTIONS_PART, context => {
    const di = context.get(DATA_CONTEXT_DI_PROVIDER)!;
    const projectInfoResource = di.getService(ProjectInfoResource);

    return new ProjectInfoFormOptionsPart(formState, projectInfoResource);
  });
}
