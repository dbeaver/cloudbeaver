/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { action, computed, observable } from 'mobx';

import { TeamInfo, TeamsResource } from '@cloudbeaver/core-authentication';
import { useObservableRef } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { useTabState } from '@cloudbeaver/core-ui';
import { ILoadableState, isArraysEqual } from '@cloudbeaver/core-utils';

import type { TeamFormMode } from '../ITeamFormProps';
import type { IGrantedUsersTabState } from './IGrantedUsersTabState';

interface State extends ILoadableState {
  state: IGrantedUsersTabState;
  changed: boolean;
  edit: () => void;
  revoke: (subjectIds: string[]) => void;
  grant: (subjectIds: string[]) => void;
  load: () => Promise<void>;
}

export function useGrantedUsers(team: TeamInfo, mode: TeamFormMode): Readonly<State> {
  const resource = useService(TeamsResource);
  const notificationService = useService(NotificationService);
  const state = useTabState<IGrantedUsersTabState>();

  return useObservableRef(
    () => ({
      get changed() {
        return !isArraysEqual(this.state.initialGrantedUsers, this.state.grantedUsers);
      },
      isLoading() {
        return this.state.loading;
      },
      isLoaded() {
        return this.state.loaded;
      },
      isError() {
        return false;
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
            const grantedUsers = await this.resource.loadGrantedUsers(this.team.teamId);
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
    { state, team, mode, resource, notificationService },
    ['load'],
  );
}
