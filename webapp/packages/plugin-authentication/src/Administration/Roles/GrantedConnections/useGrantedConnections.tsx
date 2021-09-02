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
import type { IGrantedConnectionsTabState } from './IGrantedConnectionsTabState';

interface IConnectionAccessState {
  state: IGrantedConnectionsTabState;
  revoke: (subjectIds: string[]) => void;
  grant: (subjectIds: string[]) => void;
  edit: () => void;
  load: () => Promise<void>;
}

export function useGrantedConnections(role: RoleInfo, mode: RoleFormMode): IConnectionAccessState {
  const resource = useService(RolesResource);
  const notificationService = useService(NotificationService);
  const state = useTabState<IGrantedConnectionsTabState>();

  const edit = () => {
    state.editing = !state.editing;
  };

  const revoke = (subjectIds: string[]): void => {
    state.grantedSubjects = state.grantedSubjects.filter(subject => !subjectIds.includes(subject));
  };

  const grant = (subjectIds: string[]): void => {
    state.grantedSubjects.push(...subjectIds);
  };

  const load = async () => {
    if (state.loaded || state.loading) {
      return;
    }

    try {
      state.loading = true;

      if (mode === 'edit') {
        const grantInfo = await resource.getSubjectConnectionAccess(role.roleId);
        state.grantedSubjects = grantInfo.map(subject => subject.connectionId);
        state.initialGrantedSubjects = state.grantedSubjects.slice();
      }

      state.loaded = true;
    } catch (exception) {
      notificationService.logException(exception, `Error getting granted connections for "${role.roleId}"`);
    }
    state.loading = false;
  };

  return useObjectRef({ state, revoke, grant, edit, load });
}
