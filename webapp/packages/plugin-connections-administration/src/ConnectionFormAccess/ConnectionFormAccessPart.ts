/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { FormPart, formSubmitContext, type IFormState } from '@cloudbeaver/core-ui';
import type { IExecutionContextProvider } from '@cloudbeaver/core-executor';
import { type ConnectionInfoResource } from '@cloudbeaver/core-connections';
import { action, makeObservable } from 'mobx';
import { type IConnectionFormState, ConnectionFormOptionsPart } from '@cloudbeaver/plugin-connections';
import { getSubjectDifferences } from '@cloudbeaver/core-utils';

function getDefaultState(): string[] {
  return [];
}

export class ConnectionFormAccessPart extends FormPart<string[], IConnectionFormState> {
  constructor(
    formState: IFormState<IConnectionFormState>,
    private readonly connectionInfoResource: ConnectionInfoResource,
    private readonly optionsPart: ConnectionFormOptionsPart,
  ) {
    super(formState, getDefaultState());

    makeObservable(this, {
      revoke: action.bound,
      grant: action.bound,
    });
  }

  override isOutdated(): boolean {
    return Boolean(this.optionsPart.connectionKey && this.connectionInfoResource.isOutdated(this.optionsPart.connectionKey));
  }

  protected override async loader(): Promise<void> {
    if (!this.optionsPart.connectionKey) {
      this.setInitialState(getDefaultState());
      return;
    }

    await this.connectionInfoResource.load(this.optionsPart.connectionKey);
    const subjects = await this.connectionInfoResource.loadAccessSubjects(this.optionsPart.connectionKey);

    this.setInitialState(subjects.map(subject => subject.subjectId));
  }

  protected override async saveChanges(
    data: IFormState<IConnectionFormState>,
    contexts: IExecutionContextProvider<IFormState<IConnectionFormState>>,
  ): Promise<void> {
    const submitInfo = contexts.getContext(formSubmitContext);
    if (submitInfo.type === 'test' || !this.optionsPart.connectionKey) {
      return;
    }

    const { subjectsToRevoke, subjectsToGrant } = getSubjectDifferences(this.initialState, this.state);

    const promises = [];

    if (subjectsToRevoke.length > 0) {
      promises.push(this.connectionInfoResource.deleteConnectionsAccess(this.optionsPart.connectionKey, subjectsToRevoke));
    }

    if (subjectsToGrant.length > 0) {
      promises.push(this.connectionInfoResource.addConnectionsAccess(this.optionsPart.connectionKey, subjectsToGrant));
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