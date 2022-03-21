/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { action, computed, observable } from 'mobx';

import { RoleInfo, RolesResource } from '@cloudbeaver/core-authentication';
import { useTabState } from '@cloudbeaver/core-ui';
import { useObservableRef } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { isArraysEqual } from '@cloudbeaver/core-utils';

import type { RoleFormMode } from '../IRoleFormProps';
import type { IGrantedUsersTabState } from './IGrantedUsersTabState';

interface State {
  state: IGrantedUsersTabState;
  changed: boolean;
  edit: () => void;
  revoke: (subjectIds: string[]) => void;
  grant: (subjectIds: string[]) => void;
  load: () => Promise<void>;
}

export function useGrantedUsers(role: RoleInfo, mode: RoleFormMode): Readonly<State> {
  const resource = useService(RolesResource);
  const notificationService = useService(NotificationService);
  const state = useTabState<IGrantedUsersTabState>();

  return useObservableRef(() => ({
    get changed() {
      return !isArraysEqual(this.state.initialGrantedUsers, this.state.grantedUsers);
    },
    edit() {
      this.state.editing = !this.state.editing;
    },
    revoke(subjectIds: string[]) {
      this.state.grantedUsers = this.state.grantedUsers.filter(subject => !subjectIds.includes(subject));
    },
    grant(subjectIds: string[]) {
      this.state.grantedUsers.push(...subjectIds);
    },
    async load() {
      if (this.state.loaded || this.state.loading) {
        return;
      }

      try {
        this.state.loading = true;

        if (this.mode === 'edit') {
          const grantedUsers = await this.resource.loadGrantedUsers(this.role.roleId);
          this.state.grantedUsers = grantedUsers;
          this.state.initialGrantedUsers = this.state.grantedUsers.slice();
        }

        this.state.loaded = true;
      } catch (exception: any) {
        this.notificationService.logException(exception, "Can't load users info");
      } finally {
        this.state.loading = false;
      }
    },
  }),
  { state: observable.ref, changed: computed, edit: action.bound, revoke: action.bound, grant: action.bound },
  { state, role, mode, resource, notificationService },
  ['load']);
}
