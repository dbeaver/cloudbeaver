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
import type { IGrantedConnectionsTabState } from './IGrantedConnectionsTabState';

interface State {
  state: IGrantedConnectionsTabState;
  changed: boolean;
  edit: () => void;
  revoke: (subjectIds: string[]) => void;
  grant: (subjectIds: string[]) => void;
  load: () => Promise<void>;
}

export function useGrantedConnections(role: RoleInfo, mode: RoleFormMode): Readonly<State> {
  const resource = useService(RolesResource);
  const notificationService = useService(NotificationService);
  const state = useTabState<IGrantedConnectionsTabState>();

  return useObservableRef(() => ({
    get changed() {
      return !isArraysEqual(this.state.initialGrantedSubjects, this.state.grantedSubjects);
    },
    edit() {
      this.state.editing = !this.state.editing;
    },
    grant(subjectIds: string[]) {
      this.state.grantedSubjects.push(...subjectIds);
    },
    revoke(subjectIds: string[]) {
      this.state.grantedSubjects = this.state.grantedSubjects.filter(subject => !subjectIds.includes(subject));
    },
    async load() {
      if (this.state.loaded || this.state.loading) {
        return;
      }

      try {
        this.state.loading = true;

        if (this.mode === 'edit') {
          const grantInfo = await this.resource.getSubjectConnectionAccess(this.role.roleId);
          this.state.grantedSubjects = grantInfo.map(subject => subject.connectionId);
          this.state.initialGrantedSubjects = this.state.grantedSubjects.slice();
        }

        this.state.loaded = true;
      } catch (exception: any) {
        this.notificationService.logException(exception, `Error getting granted connections for "${this.role.roleId}"`);
      } finally {
        this.state.loading = false;
      }
    },
  }),
  { state: observable.ref, changed: computed, grant: action.bound, revoke: action.bound, edit: action.bound },
  { state, role, mode, resource, notificationService },
  ['load']);
}
