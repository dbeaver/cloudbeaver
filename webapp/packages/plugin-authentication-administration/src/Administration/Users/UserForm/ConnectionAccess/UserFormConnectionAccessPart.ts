/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { UsersResource } from '@cloudbeaver/core-authentication';
import { isGlobalProject, type ProjectInfoResource } from '@cloudbeaver/core-projects';
import { type AdminConnectionGrantInfo, AdminSubjectType } from '@cloudbeaver/core-sdk';
import { FormMode, FormPart, type IFormState } from '@cloudbeaver/core-ui';
import { isArraysEqual } from '@cloudbeaver/core-utils';

import type { IUserFormState } from '../AdministrationUserFormService.js';
import type { UserFormInfoPart } from '../Info/UserFormInfoPart.js';

export class UserFormConnectionAccessPart extends FormPart<AdminConnectionGrantInfo[], IUserFormState> {
  constructor(
    formState: IFormState<IUserFormState>,
    private readonly usersResource: UsersResource,
    private readonly projectInfoResource: ProjectInfoResource,
    private readonly userFormInfoPart: UserFormInfoPart,
  ) {
    super(formState, []);
  }

  override get isChanged(): boolean {
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
    const { connectionsToRevoke, connectionsToGrant } = this.getConnectionsDifferences(
      this.getGrantedConnections(this.initialState),
      this.getGrantedConnections(this.state),
    );

    const globalProject = this.projectInfoResource.values.find(isGlobalProject);

    if (!globalProject) {
      throw new Error('The global project does not exist');
    }

    if (connectionsToRevoke.length > 0) {
      await this.usersResource.deleteConnectionsAccess(globalProject.id, this.userFormInfoPart.state.userId, connectionsToRevoke);
    }

    if (connectionsToGrant.length > 0) {
      await this.usersResource.addConnectionsAccess(globalProject.id, this.userFormInfoPart.state.userId, connectionsToGrant);
    }
  }

  private getGrantedConnections(state: AdminConnectionGrantInfo[]): string[] {
    return state.filter(connection => connection.subjectType !== AdminSubjectType.Team).map(connection => connection.dataSourceId);
  }

  private getConnectionsDifferences(current: string[], next: string[]): { connectionsToRevoke: string[]; connectionsToGrant: string[] } {
    const connectionsToRevoke = current.filter(subjectId => !next.includes(subjectId));
    const connectionsToGrant = next.filter(subjectId => !current.includes(subjectId));

    return { connectionsToRevoke, connectionsToGrant };
  }

  protected override async loader() {
    let grantedConnections: AdminConnectionGrantInfo[] = [];

    if (this.formState.mode === FormMode.Edit) {
      grantedConnections = await this.usersResource.loadConnections(this.userFormInfoPart.initialState.userId);
    }

    this.setInitialState(grantedConnections);
  }
}
