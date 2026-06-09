/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { IExecutionContextProvider } from '@cloudbeaver/core-executor';
import type { ProjectInfoResource } from '@cloudbeaver/core-projects';
import { FormPart, type IFormState } from '@cloudbeaver/core-ui';

import type { IProjectInfoFormState } from '../IProjectInfoFormState.js';
import type { IProjectInfoOptionsSchema } from './ProjectInfoOptionsSchema.js';

const getDefaultState = (): IProjectInfoOptionsSchema => ({
  description: '',
  id: '',
  name: '',
});

export class ProjectInfoFormOptionsPart extends FormPart<IProjectInfoOptionsSchema, IProjectInfoFormState> {
  constructor(
    formState: IFormState<IProjectInfoFormState>,
    private readonly projectInfoResource: ProjectInfoResource,
  ) {
    super(formState, getDefaultState());
  }

  override isOutdated(): boolean {
    return this.projectInfoResource.isOutdated(this.formState.state.projectId);
  }

  protected override async loader(): Promise<void> {
    const projectInfo = await this.projectInfoResource.load(this.formState.state.projectId);
    this.setInitialState({
      description: projectInfo.description,
      id: projectInfo.id,
      name: projectInfo.name,
    });
  }

  protected override async saveChanges(
    _data: IFormState<IProjectInfoFormState>,
    _contexts: IExecutionContextProvider<IFormState<IProjectInfoFormState>>,
  ): Promise<void> {}
}
