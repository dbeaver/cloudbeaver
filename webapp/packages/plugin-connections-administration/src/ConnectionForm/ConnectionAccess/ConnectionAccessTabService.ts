/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import React from 'react';

import { AdministrationScreenService } from '@cloudbeaver/core-administration';
import { ConnectionInfoResource, createConnectionParam, type IConnectionInfoParams } from '@cloudbeaver/core-connections';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { executorHandlerFilter, type IExecutionContextProvider } from '@cloudbeaver/core-executor';
import { isGlobalProject, ProjectInfoResource } from '@cloudbeaver/core-projects';
import { EAdminPermission, PermissionsService } from '@cloudbeaver/core-root';
import { formStateContext } from '@cloudbeaver/core-ui';
import type { MetadataValueGetter } from '@cloudbeaver/core-utils';
import {
  connectionConfigContext,
  ConnectionFormService,
  type IConnectionFormProps,
  type IConnectionFormState,
  type IConnectionFormSubmitData,
} from '@cloudbeaver/plugin-connections';

import type { IConnectionAccessTabState } from './IConnectionAccessTabState.js';

const ConnectionAccess = React.lazy(async () => {
  const { ConnectionAccess } = await import('./ConnectionAccess.js');
  return { default: ConnectionAccess };
});

@injectable()
export class ConnectionAccessTabService extends Bootstrap {
  private readonly key: string;

  constructor(
    private readonly connectionFormService: ConnectionFormService,
    private readonly administrationScreenService: AdministrationScreenService,
    private readonly connectionInfoResource: ConnectionInfoResource,
    private readonly permissionsResource: PermissionsService,
    private readonly projectInfoResource: ProjectInfoResource,
  ) {
    super();
    this.key = 'access';
  }

  override register(): void {
    this.connectionFormService.tabsContainer.add({
      key: this.key,
      name: 'connections_connection_edit_access',
      title: 'connections_connection_edit_access',
      order: 4,
      stateGetter: context => this.stateGetter(context),
      isHidden: (_, context) => !context || !this.isAccessTabActive(context.state),
      isDisabled: (tabId, props) => !props?.state.config.driverId || this.administrationScreenService.isConfigurationMode,
      panel: () => ConnectionAccess,
    });

    this.connectionFormService.formSubmittingTask.addHandler(executorHandlerFilter(data => this.isAccessTabActive(data.state), this.save.bind(this)));

    this.connectionFormService.formStateTask.addHandler(executorHandlerFilter(this.isAccessTabActive.bind(this), this.formState.bind(this)));
  }

  private isAccessTabActive(state: IConnectionFormState): boolean {
    return (
      state.projectId !== null &&
      isGlobalProject(this.projectInfoResource.get(state.projectId)) &&
      this.permissionsResource.has(EAdminPermission.admin)
    );
  }

  private stateGetter(context: IConnectionFormProps): MetadataValueGetter<string, IConnectionAccessTabState> {
    return () => ({
      loading: false,
      loaded: false,
      editing: false,
      grantedSubjects: [],
      initialGrantedSubjects: [],
    });
  }

  private async save(data: IConnectionFormSubmitData, contexts: IExecutionContextProvider<IConnectionFormSubmitData>) {
    if (data.submitType === 'test' || !data.state.projectId) {
      return;
    }
    const status = contexts.getContext(this.connectionFormService.connectionStatusContext);

    if (!status.saved) {
      return;
    }

    const config = contexts.getContext(connectionConfigContext);
    const state = this.connectionFormService.tabsContainer.getTabState<IConnectionAccessTabState>(data.state.partsState, this.key, {
      state: data.state,
    });

    if (!config.connectionId || !state.loaded) {
      return;
    }

    const key = createConnectionParam(data.state.projectId, config.connectionId);

    const currentGrantedSubjects = await this.connectionInfoResource.loadAccessSubjects(key);
    const currentGrantedSubjectIds = currentGrantedSubjects.map(subject => subject.subjectId);

    const { subjectsToRevoke, subjectsToGrant } = this.getSubjectDifferences(currentGrantedSubjectIds, state.grantedSubjects);

    if (subjectsToRevoke.length === 0 && subjectsToGrant.length === 0) {
      return;
    }

    if (subjectsToRevoke.length > 0) {
      await this.connectionInfoResource.deleteConnectionsAccess(key, subjectsToRevoke);
    }

    if (subjectsToGrant.length > 0) {
      await this.connectionInfoResource.addConnectionsAccess(key, subjectsToGrant);
    }

    state.initialGrantedSubjects = state.grantedSubjects.slice();
  }

  private async formState(data: IConnectionFormState, contexts: IExecutionContextProvider<IConnectionFormState>) {
    const config = contexts.getContext(connectionConfigContext);
    const state = this.connectionFormService.tabsContainer.getTabState<IConnectionAccessTabState>(data.partsState, this.key, { state: data });

    if (!config.connectionId || !data.projectId || !state.loaded) {
      return;
    }

    const key = createConnectionParam(data.projectId, config.connectionId);
    const changed = await this.isChanged(key, state.grantedSubjects);

    if (changed) {
      const stateContext = contexts.getContext(formStateContext);

      stateContext.markEdited();
    }
  }

  private async isChanged(connectionKey: IConnectionInfoParams, next: string[]): Promise<boolean> {
    const current = await this.connectionInfoResource.loadAccessSubjects(connectionKey);
    if (current.length !== next.length) {
      return true;
    }

    return current.some(value => !next.some(subjectId => subjectId === value.subjectId));
  }

  private getSubjectDifferences(current: string[], next: string[]): { subjectsToRevoke: string[]; subjectsToGrant: string[] } {
    const subjectsToRevoke = current.filter(subjectId => !next.includes(subjectId));
    const subjectsToGrant = next.filter(subjectId => !current.includes(subjectId));

    return { subjectsToRevoke, subjectsToGrant };
  }
}
