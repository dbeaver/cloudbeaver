/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { action, computed, observable, toJS } from 'mobx';

import { type TeamInfo, TeamsResource } from '@cloudbeaver/core-authentication';
import { useObservableRef } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { useTabState } from '@cloudbeaver/core-ui';
import { type ILoadableState, isArraysEqual, isObjectsEqual } from '@cloudbeaver/core-utils';

import type { TeamFormMode } from '../ITeamFormProps.js';
import type { IGrantedUsersTabState } from './IGrantedUsersTabState.js';

interface State extends ILoadableState {
  state: IGrantedUsersTabState;
  changed: boolean;
  edit: () => void;
  revoke: (subjectIds: string[]) => void;
  grant: (subjectIds: string[]) => void;
  assignTeamRole: (subjectId: string, teamRole: string | null) => void;
  load: () => Promise<void>;
}

export function useGrantedUsers(team: TeamInfo, mode: TeamFormMode): Readonly<State> {
  const resource = useService(TeamsResource);
  const notificationService = useService(NotificationService);
  const state = useTabState<IGrantedUsersTabState>();

  return useObservableRef(
    () => ({
      get changed() {
        return !isArraysEqual(this.state.initialGrantedUsers, this.state.grantedUsers, isObjectsEqual);
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
        this.state.grantedUsers = this.state.grantedUsers.filter(subject => !subjectIds.includes(subject.userId));
      },
      grant(subjectIds: string[]) {
        this.state.grantedUsers.push(...subjectIds.map(id => ({ userId: id, teamRole: null })));
      },
      assignTeamRole(subjectId: string, teamRole: string | null) {
        const user = this.state.grantedUsers.find(user => user.userId === subjectId);

        if (user) {
          user.teamRole = teamRole;
        }
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
            this.state.initialGrantedUsers = toJS(this.state.grantedUsers);
          }

          this.state.loaded = true;
        } catch (exception: any) {
          this.notificationService.logException(exception, "Can't load users info");
        } finally {
          this.state.loading = false;
        }
      },
    }),
    { state: observable.ref, changed: computed, edit: action.bound, revoke: action.bound, grant: action.bound, assignTeamRole: action.bound },
    { state, team, mode, resource, notificationService },
    ['load'],
  );
}
