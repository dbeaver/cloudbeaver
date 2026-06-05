/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { IExecutionContextProvider } from '@cloudbeaver/core-executor';
import type { ProjectInfo, ProjectInfoResource } from '@cloudbeaver/core-projects';
import { FormPart, type IFormState } from '@cloudbeaver/core-ui';

import type { IProjectInfoFormState } from '../IProjectInfoFormState.js';

export interface IProjectInfoFormOptionsState {
  projectInfo: ProjectInfo | null;
}

const getDefaultState = (): IProjectInfoFormOptionsState => ({
  projectInfo: null,
});

export class ProjectInfoFormOptionsPart extends FormPart<IProjectInfoFormOptionsState, IProjectInfoFormState> {
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
    this.setInitialState({ projectInfo });
  }

  protected override async saveChanges(
    _data: IFormState<IProjectInfoFormState>,
    _contexts: IExecutionContextProvider<IFormState<IProjectInfoFormState>>,
  ): Promise<void> {}
}
