/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { RoleInfo, RolesResource } from '@cloudbeaver/core-authentication';
import { useObjectRef, useTabState } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';

import type { RoleFormMode } from '../IRoleFormProps';
import type { IGrantedUsersTabState } from './IGrantedUsersTabState';

interface IConnectionAccessState {
  state: IGrantedUsersTabState;
  revoke: (subjectIds: string[]) => void;
  grant: (subjectIds: string[]) => void;
  edit: () => void;
  load: () => Promise<void>;
}

export function useGrantedUsers(role: RoleInfo, mode: RoleFormMode): IConnectionAccessState {
  const resource = useService(RolesResource);
  const notificationService = useService(NotificationService);
  const state = useTabState<IGrantedUsersTabState>();

  const edit = () => {
    state.editing = !state.editing;
  };

  const revoke = (subjectIds: string[]): void => {
    state.grantedUsers = state.grantedUsers.filter(subject => !subjectIds.includes(subject));
  };

  const grant = (subjectIds: string[]): void => {
    state.grantedUsers.push(...subjectIds);
  };

  const load = async () => {
    if (state.loaded || state.loading) {
      return;
    }

    try {
      state.loading = true;

      if (mode === 'edit') {
        const grantedUsers = await resource.loadGrantedUsers(role.roleId);
        state.grantedUsers.push(...grantedUsers);

        state.initialGrantedUsers = state.grantedUsers.slice();
      }

      state.loaded = true;
    } catch (exception) {
      notificationService.logException(exception, "Can't load users info");
    }
    state.loading = false;
  };

  return useObjectRef({ state, revoke, grant, edit, load });
}
