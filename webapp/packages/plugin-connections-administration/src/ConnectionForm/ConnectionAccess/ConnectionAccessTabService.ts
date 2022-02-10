/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { AdministrationScreenService } from '@cloudbeaver/core-administration';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import type { IExecutionContextProvider } from '@cloudbeaver/core-executor';
import type { MetadataValueGetter } from '@cloudbeaver/core-utils';
import { connectionConfigContext, ConnectionFormService, connectionFormStateContext, IConnectionFormProps, IConnectionFormState, IConnectionFormSubmitData } from '@cloudbeaver/plugin-connections';

import { ConnectionsResource } from '../../Administration/ConnectionsResource';
import { ConnectionAccess } from './ConnectionAccess';
import type { IConnectionAccessTabState } from './IConnectionAccessTabState';

@injectable()
export class ConnectionAccessTabService extends Bootstrap {
  private readonly key: string;

  constructor(
    private readonly connectionFormService: ConnectionFormService,
    private readonly administrationScreenService: AdministrationScreenService,
    private readonly connectionsResource: ConnectionsResource,
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
      isHidden: (tabId, props) => props?.state.type !== 'admin',
      isDisabled: (tabId, props) => !props?.state.config.driverId
        || this.administrationScreenService.isConfigurationMode,
      panel: () => ConnectionAccess,
    });

    this.connectionFormService.formSubmittingTask
      .addHandler(this.save.bind(this));

    this.connectionFormService.formStateTask
      .addHandler(this.formState.bind(this));
  }

  load(): void { }

  private stateGetter(context: IConnectionFormProps): MetadataValueGetter<string, IConnectionAccessTabState> {
    return () => ({
      loading: false,
      loaded: false,
      editing: false,
      grantedSubjects: [],
      initialGrantedSubjects: [],
    });
  }

  private async save(
    data: IConnectionFormSubmitData,
    contexts: IExecutionContextProvider<IConnectionFormSubmitData>
  ) {
    if (data.submitType === 'test' || data.state.type === 'public') {
      return;
    }
    const status = contexts.getContext(this.connectionFormService.connectionStatusContext);

    if (!status.saved) {
      return;
    }

    const config = contexts.getContext(connectionConfigContext);
    const state = this.connectionFormService.tabsContainer.getTabState<IConnectionAccessTabState>(
      data.state.partsState,
      this.key,
      { state: data.state }
    );

    if (!config.connectionId || !state.loaded) {
      return;
    }

    const changed = await this.isChanged(config.connectionId, state.grantedSubjects);

    if (changed) {
      await this.connectionsResource.setAccessSubjects(
        config.connectionId,
        state.grantedSubjects
      );
      state.initialGrantedSubjects = state.grantedSubjects.slice();
    }
  }

  private async formState(
    data: IConnectionFormState,
    contexts: IExecutionContextProvider<IConnectionFormState>
  ) {
    if (data.type === 'public') {
      return;
    }
    const config = contexts.getContext(connectionConfigContext);
    const state = this.connectionFormService.tabsContainer.getTabState<IConnectionAccessTabState>(
      data.partsState,
      this.key,
      { state: data }
    );

    if (!config.connectionId) {
      return;
    }

    const changed = await this.isChanged(config.connectionId, state.grantedSubjects);

    if (changed) {
      const stateContext = contexts.getContext(connectionFormStateContext);

      stateContext.markEdited();
    }
  }

  private async isChanged(connectionId: string, next: string[]): Promise<boolean> {
    const current = await this.connectionsResource.loadAccessSubjects(connectionId);
    if (current.length !== next.length) {
      return true;
    }

    return current.some(value => !next.some(subjectId => subjectId === value.subjectId));
  }
}
