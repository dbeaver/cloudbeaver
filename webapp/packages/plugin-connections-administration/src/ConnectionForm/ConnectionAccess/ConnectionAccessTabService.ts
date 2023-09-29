/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import React from 'react';

import { AdministrationScreenService } from '@cloudbeaver/core-administration';
import { EAdminPermission } from '@cloudbeaver/core-authentication';
import { ConnectionInfoResource, createConnectionParam, IConnectionInfoParams } from '@cloudbeaver/core-connections';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { executorHandlerFilter, IExecutionContextProvider } from '@cloudbeaver/core-executor';
import { isGlobalProject, ProjectInfoResource } from '@cloudbeaver/core-projects';
import { PermissionsService } from '@cloudbeaver/core-root';
import { formStateContext } from '@cloudbeaver/core-ui';
import type { MetadataValueGetter } from '@cloudbeaver/core-utils';
import {
  connectionConfigContext,
  ConnectionFormService,
  IConnectionFormProps,
  IConnectionFormState,
  IConnectionFormSubmitData,
} from '@cloudbeaver/plugin-connections';

import type { IConnectionAccessTabState } from './IConnectionAccessTabState';

const ConnectionAccess = React.lazy(async () => {
  const { ConnectionAccess } = await import('./ConnectionAccess');
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

  register(): void {
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

  load(): void {}

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

    const changed = await this.isChanged(key, state.grantedSubjects);

    if (changed) {
      if (state.initialGrantedSubjects.length > state.grantedSubjects.length) {

        const subjectsToRemove = state.initialGrantedSubjects.filter(subject => !state.grantedSubjects.includes(subject));
        await this.connectionInfoResource.deleteConnectionsAccess(key, subjectsToRemove);
      } else if (state.initialGrantedSubjects.length < state.grantedSubjects.length) {

        const subjectsToAdd = state.grantedSubjects.filter(subject => !state.initialGrantedSubjects.includes(subject));
        await this.connectionInfoResource.addConnectionsAccess(key, subjectsToAdd);
      }
      state.initialGrantedSubjects = state.grantedSubjects.slice();
    }
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
}
