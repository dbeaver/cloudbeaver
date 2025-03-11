/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { FormPart, formStatusContext, type IFormState } from '@cloudbeaver/core-ui';
import type { IExecutionContextProvider } from '@cloudbeaver/core-executor';
import type { IConnectionFormAccessState } from './IConnectionFormAccessState.js';
import { createConnectionParam, type ConnectionInfoResource } from '@cloudbeaver/core-connections';
import { action, makeObservable } from 'mobx';
import type { IConnectionFormState } from '@cloudbeaver/plugin-connections';

const getDefaultState = () =>
  ({
    grantedSubjects: [],
    editing: false,
  }) as IConnectionFormAccessState;

export class ConnectionFormAccessPart extends FormPart<IConnectionFormAccessState, IConnectionFormState> {
  constructor(
    formState: IFormState<IConnectionFormState>,
    private readonly connectionInfoResource: ConnectionInfoResource,
  ) {
    super(formState, getDefaultState());

    makeObservable(this, {
      edit: action.bound,
      revoke: action.bound,
      grant: action.bound,
    });
  }

  protected override async loader(): Promise<void> {
    const connectionId = this.formState.state.config.connectionId;
    const projectId = this.formState.state.projectId;

    if (!connectionId || !projectId) {
      this.setInitialState(getDefaultState());
      return;
    }

    const key = createConnectionParam(projectId, connectionId);
    const subjects = await this.connectionInfoResource.loadAccessSubjects(key);

    this.setInitialState({
      ...getDefaultState(),
      grantedSubjects: subjects.map(subject => subject.subjectId),
    });
  }

  protected override async saveChanges(
    data: IFormState<IConnectionFormState>,
    contexts: IExecutionContextProvider<IFormState<IConnectionFormState>>,
  ): Promise<void> {
    const status = contexts.getContext(formStatusContext);
    const connectionId = this.formState.state.config.connectionId;

    if (this.formState.state.submitType === 'test' || !data.state.projectId || !status.saved || !connectionId || !this.loaded) {
      return;
    }

    const key = createConnectionParam(data.state.projectId, connectionId);

    const currentGrantedSubjects = await this.connectionInfoResource.loadAccessSubjects(key);
    const currentGrantedSubjectIds = currentGrantedSubjects.map(subject => subject.subjectId);

    const { subjectsToRevoke, subjectsToGrant } = getSubjectDifferences(currentGrantedSubjectIds, this.state.grantedSubjects);

    if (subjectsToRevoke.length === 0 && subjectsToGrant.length === 0) {
      return;
    }

    const promises = [];

    if (subjectsToRevoke.length > 0) {
      promises.push(this.connectionInfoResource.deleteConnectionsAccess(key, subjectsToRevoke));
    }

    if (subjectsToGrant.length > 0) {
      promises.push(this.connectionInfoResource.addConnectionsAccess(key, subjectsToGrant));
    }

    await Promise.all(promises);
  }

  edit() {
    this.state.editing = !this.state.editing;
  }

  revoke(subjectIds: string[]) {
    this.state.grantedSubjects = this.state.grantedSubjects.filter(subject => !subjectIds.includes(subject));
  }

  grant(subjectIds: string[]) {
    this.state.grantedSubjects.push(...subjectIds);
  }
}

function getSubjectDifferences(current: string[], next: string[]): { subjectsToRevoke: string[]; subjectsToGrant: string[] } {
  const subjectsToRevoke = current.filter(subjectId => !next.includes(subjectId));
  const subjectsToGrant = next.filter(subjectId => !current.includes(subjectId));

  return { subjectsToRevoke, subjectsToGrant };
}
