/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { ConnectionsResource, DBDriverResource } from '@cloudbeaver/core-connections';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import type { IExecutionContextProvider } from '@cloudbeaver/core-executor';
import { GraphQLService } from '@cloudbeaver/core-sdk';
import { isArraysEqual, MetadataValueGetter } from '@cloudbeaver/core-utils';

import { roleContext } from '../Contexts/roleContext';
import type { IRoleFormProps, IRoleFormSubmitData } from '../IRoleFormProps';
import { RoleFormService } from '../RoleFormService';
import { GrantedConnections } from './GrantedConnections';
import type { IGrantedConnectionsTabState } from './IGrantedConnectionsTabState';

@injectable()
export class GrantedConnectionsTabService extends Bootstrap {
  private key: string;

  constructor(
    private readonly roleFormService: RoleFormService,
    private readonly connectionsResource: ConnectionsResource,
    private readonly graphQLService: GraphQLService,
    private readonly dbDriverResource: DBDriverResource,
    private readonly notificationService: NotificationService
  ) {
    super();
    this.key = 'granted-connections';
  }

  register(): void {
    this.roleFormService.tabsContainer.add({
      key: this.key,
      name: 'administration_roles_role_granted_connections_tab_title',
      title: 'administration_roles_role_granted_connections_tab_title',
      order: 3,
      onOpen: () => {
        this.connectionsResource.loadAll();
        this.dbDriverResource.loadAll();
      },
      stateGetter: context => this.stateGetter(context),
      panel: () => GrantedConnections,
    });

    this.roleFormService.formSubmittingTask
      .addHandler(this.save.bind(this));
  }

  load(): Promise<void> | void { }

  private stateGetter(context: IRoleFormProps): MetadataValueGetter<string, IGrantedConnectionsTabState> {
    return () => ({
      loading: false,
      loaded: false,
      editing: false,
      grantedSubjects: [],
      initialGrantedSubjects: [],
    });
  }

  private async save(
    data: IRoleFormSubmitData,
    contexts: IExecutionContextProvider<IRoleFormSubmitData>
  ) {
    const config = contexts.getContext(roleContext);

    const state = this.roleFormService.tabsContainer.getTabState<IGrantedConnectionsTabState>(
      data.state.partsState,
      this.key,
      { state: data.state }
    );

    const changed = !isArraysEqual(state.initialGrantedSubjects, state.grantedSubjects);

    if (!config.roleId || !state.loaded || !changed) {
      return;
    }

    try {
      await this.graphQLService.sdk.setSubjectConnectionAccess({
        subjectId: config.roleId,
        connections: state.grantedSubjects,
      });
    } catch (exception) {
      this.notificationService.logException(exception);
    }

    state.initialGrantedSubjects = state.grantedSubjects.slice();
  }
}
