/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { UsersResource } from '@cloudbeaver/core-authentication';
import { type AdminConnectionGrantInfo, AdminSubjectType } from '@cloudbeaver/core-sdk';
import { FormMode, FormPart } from '@cloudbeaver/core-ui';
import { isArraysEqual } from '@cloudbeaver/core-utils';

import type { IUserFormState } from '../AdministrationUserFormService';
import type { AdministrationUserFormState } from '../AdministrationUserFormState';
import { DATA_CONTEXT_USER_FORM_INFO_PART } from '../Info/DATA_CONTEXT_USER_FORM_INFO_PART';

export class UserFormConnectionAccessPart extends FormPart<AdminConnectionGrantInfo[], IUserFormState> {
  constructor(formState: AdministrationUserFormState, private readonly usersResource: UsersResource) {
    super(formState, []);
  }

  isChanged(): boolean {
    if (!this.loaded) {
      return false;
    }

    return !isArraysEqual(this.getGrantedConnections(this.state), this.getGrantedConnections(this.initialState));
  }

  has(connectionId: string): boolean {
    return this.state.some(connection => connection.dataSourceId === connectionId);
  }

  add(connectionId: string): void {
    if (this.has(connectionId)) {
      return;
    }

    this.state.push({
      subjectId: '',
      subjectType: AdminSubjectType.User,
      dataSourceId: connectionId,
      connectionId,
    });
  }

  delete(connectionId: string): void {
    const index = this.state.findIndex(connection => connection.dataSourceId === connectionId);

    if (index === -1) {
      return;
    }

    this.state.splice(index, 1);
  }

  protected override async saveChanges() {
    const userFormInfoPart = this.formState.dataContext.get(DATA_CONTEXT_USER_FORM_INFO_PART);
    await this.usersResource.setConnections(userFormInfoPart.state.userId, this.getGrantedConnections(this.state));
  }

  private getGrantedConnections(state: AdminConnectionGrantInfo[]): string[] {
    return state.filter(connection => connection.subjectType !== AdminSubjectType.Team).map(connection => connection.dataSourceId);
  }

  protected override async loader() {
    const userFormInfoPart = this.formState.dataContext.get(DATA_CONTEXT_USER_FORM_INFO_PART);
    let grantedConnections: AdminConnectionGrantInfo[] = [];

    if (this.formState.mode === FormMode.Edit) {
      grantedConnections = await this.usersResource.loadConnections(userFormInfoPart.initialState.userId);
    }

    this.setInitialState(grantedConnections);
  }
}
