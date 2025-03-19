/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { FormPart, formStatusContext, type IFormState } from '@cloudbeaver/core-ui';
import type { IExecutionContextProvider } from '@cloudbeaver/core-executor';
import { createConnectionParam, type ConnectionInfoResource } from '@cloudbeaver/core-connections';
import { action, makeObservable } from 'mobx';
import { getConnectionFormOptionsPart, type IConnectionFormState } from '@cloudbeaver/plugin-connections';
import { getSubjectDifferences } from '@cloudbeaver/core-utils';

function getDefaultState(): string[] {
  return [];
}

export class ConnectionFormAccessPart extends FormPart<string[], IConnectionFormState> {
  constructor(
    formState: IFormState<IConnectionFormState>,
    private readonly connectionInfoResource: ConnectionInfoResource,
  ) {
    super(formState, getDefaultState());

    makeObservable(this, {
      revoke: action.bound,
      grant: action.bound,
    });
  }

  protected override async loader(): Promise<void> {
    const optionsPart = getConnectionFormOptionsPart(this.formState);
    const connectionId = optionsPart.state.connectionId;
    const projectId = this.formState.state.projectId;

    if (!connectionId || !projectId) {
      this.setInitialState(getDefaultState());
      return;
    }

    const key = createConnectionParam(projectId, connectionId);
    const subjects = await this.connectionInfoResource.loadAccessSubjects(key);

    this.setInitialState(subjects.map(subject => subject.subjectId));
  }

  protected override async saveChanges(
    data: IFormState<IConnectionFormState>,
    contexts: IExecutionContextProvider<IFormState<IConnectionFormState>>,
  ): Promise<void> {
    const status = contexts.getContext(formStatusContext);
    const optionsPart = getConnectionFormOptionsPart(this.formState);
    const connectionId = optionsPart.state.connectionId;

    if (this.formState.state.submitType === 'test' || !data.state.projectId || !status.saved || !connectionId || !this.loaded) {
      return;
    }

    const key = createConnectionParam(data.state.projectId, connectionId);
    const { subjectsToRevoke, subjectsToGrant } = getSubjectDifferences(this.initialState, this.state);

    const promises = [];

    if (subjectsToRevoke.length > 0) {
      promises.push(this.connectionInfoResource.deleteConnectionsAccess(key, subjectsToRevoke));
    }

    if (subjectsToGrant.length > 0) {
      promises.push(this.connectionInfoResource.addConnectionsAccess(key, subjectsToGrant));
    }

    await Promise.all(promises);
  }

  revoke(subjectIds: string[]) {
    this.state = this.state.filter(subject => !subjectIds.includes(subject));
  }

  grant(subjectIds: string[]) {
    this.state.push(...subjectIds);
  }
}
