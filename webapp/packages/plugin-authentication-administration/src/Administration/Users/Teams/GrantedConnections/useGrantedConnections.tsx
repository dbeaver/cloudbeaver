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
import type { IGrantedConnectionsTabState } from './IGrantedConnectionsTabState';

interface State extends ILoadableState {
  state: IGrantedConnectionsTabState;
  changed: boolean;
  edit: () => void;
  revoke: (subjectIds: string[]) => void;
  grant: (subjectIds: string[]) => void;
  load: () => Promise<void>;
}

export function useGrantedConnections(team: TeamInfo, mode: TeamFormMode): Readonly<State> {
  const resource = useService(TeamsResource);
  const notificationService = useService(NotificationService);
  const state = useTabState<IGrantedConnectionsTabState>();

  return useObservableRef(() => ({
    get changed() {
      return !isArraysEqual(this.state.initialGrantedSubjects, this.state.grantedSubjects);
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
          const grantInfo = await this.resource.getSubjectConnectionAccess(this.team.teamId);
          this.state.grantedSubjects = grantInfo.map(subject => subject.dataSourceId);
          this.state.initialGrantedSubjects = this.state.grantedSubjects.slice();
        }

        this.state.loaded = true;
      } catch (exception: any) {
        this.notificationService.logException(exception, `Error getting granted connections for "${this.team.teamId}"`);
      } finally {
        this.state.loading = false;
      }
    },
  }),
  { state: observable.ref, changed: computed, grant: action.bound, revoke: action.bound, edit: action.bound },
  { state, team, mode, resource, notificationService },
  ['load']);
}
