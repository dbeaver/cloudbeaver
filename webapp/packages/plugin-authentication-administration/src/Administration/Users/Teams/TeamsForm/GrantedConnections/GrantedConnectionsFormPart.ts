/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { TeamsResource } from '@cloudbeaver/core-authentication';
import type { IExecutionContextProvider } from '@cloudbeaver/core-executor';
import { isGlobalProject, ProjectInfoResource } from '@cloudbeaver/core-projects';
import { GraphQLService } from '@cloudbeaver/core-sdk';
import { FormPart, type IFormState } from '@cloudbeaver/core-ui';

import type { ITeamFormState } from '../TeamsAdministrationFormService.js';
import type { IGrantedConnectionsState } from './IGrantedConnectionsState.js';

function getInitialState(): IGrantedConnectionsState {
  return {
    grantedSubjects: [],
  };
}

export class GrantedConnectionsFormPart extends FormPart<IGrantedConnectionsState, ITeamFormState> {
  constructor(
    formState: IFormState<ITeamFormState>,
    private readonly projectInfoResource: ProjectInfoResource,
    private readonly teamsResource: TeamsResource,
    private readonly graphQLService: GraphQLService,
  ) {
    super(formState, getInitialState());

    this.grant = this.grant.bind(this);
    this.revoke = this.revoke.bind(this);
  }

  protected override async loader(): Promise<void> {
    if (this.formState.mode === 'edit' && this.formState.state.teamId) {
      const grantInfo = await this.teamsResource.getSubjectConnectionAccess(this.formState.state.teamId);

      this.setInitialState({
        ...getInitialState(),
        grantedSubjects: grantInfo.map(info => info.connectionId),
      });
      return;
    }

    this.setInitialState(getInitialState());
  }

  protected override async saveChanges(
    data: IFormState<ITeamFormState>,
    contexts: IExecutionContextProvider<IFormState<ITeamFormState>>,
  ): Promise<void> {
    const teamId = this.formState.state.teamId!;
    const globalProject = this.projectInfoResource.values.find(isGlobalProject);

    if (!globalProject) {
      throw new Error('The global project does not exist');
    }

    const { connectionsToRevoke, connectionsToGrant } = this.getConnectionsUpdates(this.initialState.grantedSubjects, this.state.grantedSubjects);

    if (connectionsToRevoke.length > 0) {
      await this.graphQLService.sdk.deleteConnectionsAccess({
        projectId: globalProject.id,
        subjects: [teamId],
        connectionIds: connectionsToRevoke,
      });
    }

    if (connectionsToGrant.length > 0) {
      await this.graphQLService.sdk.addConnectionsAccess({
        projectId: globalProject.id,
        subjects: [teamId],
        connectionIds: connectionsToGrant,
      });
    }
  }

  grant(subjectIds: string[]) {
    this.state.grantedSubjects.push(...subjectIds);
  }

  revoke(subjectIds: string[]) {
    this.state.grantedSubjects = this.state.grantedSubjects.filter(subject => !subjectIds.includes(subject));
  }

  private getConnectionsUpdates(current: string[], next: string[]): { connectionsToRevoke: string[]; connectionsToGrant: string[] } {
    const connectionsToRevoke = current.filter(connectionId => !next.includes(connectionId));
    const connectionsToGrant = next.filter(connectionId => !current.includes(connectionId));

    return { connectionsToRevoke, connectionsToGrant };
  }
}
