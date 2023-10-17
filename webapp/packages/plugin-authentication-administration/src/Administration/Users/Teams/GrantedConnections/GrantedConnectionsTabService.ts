/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import React from 'react';

import { TeamsResource } from '@cloudbeaver/core-authentication';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { executorHandlerFilter, IExecutionContextProvider } from '@cloudbeaver/core-executor';
import { isGlobalProject, ProjectInfoResource } from '@cloudbeaver/core-projects';
import { CachedMapAllKey } from '@cloudbeaver/core-resource';
import { AdminConnectionGrantInfo, GraphQLService } from '@cloudbeaver/core-sdk';
import { isArraysEqual, MetadataValueGetter } from '@cloudbeaver/core-utils';

import { teamContext } from '../Contexts/teamContext';
import type { ITeamFormProps, ITeamFormSubmitData } from '../ITeamFormProps';
import { TeamFormService } from '../TeamFormService';
import type { IGrantedConnectionsTabState } from './IGrantedConnectionsTabState';

const GrantedConnections = React.lazy(async () => {
  const { GrantedConnections } = await import('./GrantedConnections');
  return { default: GrantedConnections };
});

@injectable()
export class GrantedConnectionsTabService extends Bootstrap {
  private readonly key: string;

  constructor(
    private readonly teamFormService: TeamFormService,
    private readonly teamsResource: TeamsResource,
    private readonly graphQLService: GraphQLService,
    private readonly notificationService: NotificationService,
    private readonly projectInfoResource: ProjectInfoResource,
  ) {
    super();
    this.key = 'granted-connections';
  }

  register(): void {
    this.teamFormService.tabsContainer.add({
      key: this.key,
      name: 'administration_teams_team_granted_connections_tab_title',
      title: 'administration_teams_team_granted_connections_tab_title',
      order: 3,
      stateGetter: context => this.stateGetter(context),
      isHidden: () => !this.isEnabled(),
      panel: () => GrantedConnections,
    });

    this.teamFormService.afterFormSubmittingTask.addHandler(executorHandlerFilter(() => this.isEnabled(), this.save.bind(this)));

    this.teamFormService.configureTask.addHandler(() => this.projectInfoResource.load(CachedMapAllKey));
  }

  load(): Promise<void> | void {}

  private isEnabled(): boolean {
    return this.projectInfoResource.values.some(isGlobalProject);
  }

  private stateGetter(context: ITeamFormProps): MetadataValueGetter<string, IGrantedConnectionsTabState> {
    return () => ({
      loading: false,
      loaded: false,
      editing: false,
      grantedSubjects: [],
      initialGrantedSubjects: [],
    });
  }

  private async save(data: ITeamFormSubmitData, contexts: IExecutionContextProvider<ITeamFormSubmitData>) {
    const config = contexts.getContext(teamContext);
    const status = contexts.getContext(this.teamFormService.configurationStatusContext);

    if (!status.saved) {
      return;
    }

    const state = this.teamFormService.tabsContainer.getTabState<IGrantedConnectionsTabState>(data.state.partsState, this.key, { state: data.state });

    if (!config.teamId || !state.loaded) {
      return;
    }

    const globalProject = this.projectInfoResource.values.find(isGlobalProject);

    if (!globalProject) {
      throw new Error('The global project does not exist');
    }

    const grantInfo = await this.teamsResource.getSubjectConnectionAccess(config.teamId);
    const initial = grantInfo.map(info => info.connectionId);

    const changed = !isArraysEqual(initial, state.grantedSubjects);

    if (!changed) {
      return;
    }

    const { connectionsToRevoke, connectionsToGrant } = this.getConnectionsDifferences(grantInfo, state);

    try {
      if (connectionsToRevoke.length > 0) {
        await this.graphQLService.sdk.deleteConnectionsAccess({
          projectId: globalProject.id,
          subjects: [config.teamId],
          connectionIds: connectionsToRevoke,
        });
      }

      if (connectionsToGrant.length > 0) {
        await this.graphQLService.sdk.addConnectionsAccess({
          projectId: globalProject.id,
          subjects: [config.teamId],
          connectionIds: connectionsToGrant,
        });
      }

      state.loaded = false;
    } catch (exception: any) {
      this.notificationService.logException(exception);
    }
  }

  private getConnectionsDifferences(
    grantInfo: AdminConnectionGrantInfo[],
    state: IGrantedConnectionsTabState,
  ): { connectionsToRevoke: string[]; connectionsToGrant: string[] } {
    const current = grantInfo.map(info => info.connectionId);
    const next = state.grantedSubjects;

    const connectionsToRevoke = current.filter(connectionId => !next.includes(connectionId));
    const connectionsToGrant = next.filter(connectionId => !current.includes(connectionId));

    return { connectionsToRevoke, connectionsToGrant };
  }
}
