/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { RolesResource, UsersResource } from '@cloudbeaver/core-authentication';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import type { IExecutionContextProvider } from '@cloudbeaver/core-executor';
import { isArraysEqual, MetadataValueGetter } from '@cloudbeaver/core-utils';

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
    private readonly rolesResource: RolesResource,
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
      grantedUsers: [],
      initialGrantedUsers: [],
    });
  }

  private async save(
    data: IRoleFormSubmitData,
    contexts: IExecutionContextProvider<IRoleFormSubmitData>
  ) {
    const config = contexts.getContext(roleContext);
    const status = contexts.getContext(this.roleFormService.configurationStatusContext);

    if (!status.saved) {
      return;
    }

    const state = this.roleFormService.tabsContainer.getTabState<IGrantedUsersTabState>(
      data.state.partsState,
      this.key,
      { state: data.state }
    );

    if (!config.roleId || !state.loaded) {
      return;
    }

    const initial = await this.rolesResource.loadGrantedUsers(config.roleId);

    const changed = !isArraysEqual(initial, state.grantedUsers);

    if (!changed) {
      return;
    }

    const granted: string[] = [];
    const revoked: string[] = [];

    const revokedUsers = initial.filter(user => !state.grantedUsers.includes(user));

    try {
      for (const user of revokedUsers) {
        await this.usersResource.revokeRole(user, config.roleId);
        revoked.push(user);
      }

      for (const user of state.grantedUsers) {
        if (!initial.includes(user)) {
          await this.usersResource.grantRole(user, config.roleId);
          granted.push(user);
        }
      }

      state.loaded = false;
    } catch (exception: any) {
      this.notificationService.logException(exception);
    }

    if (granted.length) {
      status.info(`Added users: "${granted.join(', ')}"`);
    }

    if (revoked.length) {
      status.info(`Deleted users: "${revoked.join(', ')}"`);
    }
  }
}
