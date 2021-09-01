/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { UsersResource } from '@cloudbeaver/core-authentication';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import type { IExecutionContextProvider } from '@cloudbeaver/core-executor';
import type { MetadataValueGetter } from '@cloudbeaver/core-utils';

import { roleContext } from '../Contexts/roleContext';
import type { IRoleFormProps, IRoleFormSubmitData } from '../IRoleFormProps';
import { RoleFormService } from '../RoleFormService';
import { GrantedUsers } from './GrantedUsers';
import type { IGrantedUsersTabState } from './IGrantedUsersTabState';

@injectable()
export class GrantedUsersTabService extends Bootstrap {
  private key: string;

  constructor(
    private readonly roleFormService: RoleFormService,
    private readonly usersResource: UsersResource,
    private readonly notificationService: NotificationService
  ) {
    super();
    this.key = 'granted-users';
  }

  register(): void {
    this.roleFormService.tabsContainer.add({
      key: this.key,
      name: 'administration_roles_role_granted_users_tab_title',
      title: 'administration_roles_role_granted_users_tab_title',
      order: 2,
      stateGetter: context => this.stateGetter(context),
      panel: () => GrantedUsers,
    });

    this.roleFormService.formSubmittingTask.addHandler(this.save.bind(this));
  }

  load(): void { }

  private stateGetter(context: IRoleFormProps): MetadataValueGetter<string, IGrantedUsersTabState> {
    return () => ({
      loading: false,
      loaded: false,
      editing: false,
      grantedUsers: new Map(),
      initialGrantedUsers: new Map(),
    });
  }

  private async save(
    data: IRoleFormSubmitData,
    contexts: IExecutionContextProvider<IRoleFormSubmitData>
  ) {
    const config = contexts.getContext(roleContext);
    const status = contexts.getContext(this.roleFormService.configurationStatusContext);

    const state = this.roleFormService.tabsContainer.getTabState<IGrantedUsersTabState>(
      data.state.partsState,
      this.key,
      { state: data.state }
    );

    if (!config.roleId || !state.loaded) {
      return;
    }

    const grantedIds: string[] = [];
    const revokedIds: string[] = [];

    for (const [userId, granted] of state.grantedUsers) {
      try {
        const changed = state.initialGrantedUsers.has(userId) && state.initialGrantedUsers.get(userId) !== granted;
        if (!changed) {
          continue;
        }

        if (granted) {
          await this.usersResource.grantRole(userId, config.roleId);
          grantedIds.push(userId);
        } else {
          await this.usersResource.revokeRole(userId, config.roleId);
          revokedIds.push(userId);
        }
      } catch (exception) {
        this.notificationService.logException(
          exception,
          `The role "${config.roleId}" wasn't ${granted ? 'granted to' : 'revoked from'} "${userId}"`,
        );
        break;
      }
    }

    if (grantedIds.length) {
      status.info(`Granted users: "${grantedIds.join(', ')}"`);
    }

    if (revokedIds.length) {
      status.info(`Revoked users: "${revokedIds.join(', ')}"`);
    }

    if (grantedIds.length || revokedIds.length) {
      state.initialGrantedUsers = new Map(state.grantedUsers);
    }
  }
}
