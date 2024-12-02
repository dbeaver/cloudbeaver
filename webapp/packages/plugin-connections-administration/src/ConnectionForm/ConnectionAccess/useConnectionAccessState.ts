/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { action, computed, observable } from 'mobx';

import { useObservableRef } from '@cloudbeaver/core-blocks';
import { ConnectionInfoResource, createConnectionParam } from '@cloudbeaver/core-connections';
import { useService } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import type { DatabaseConnectionFragment } from '@cloudbeaver/core-sdk';
import { useTabState } from '@cloudbeaver/core-ui';
import { type ILoadableState, isArraysEqual, isContainsException } from '@cloudbeaver/core-utils';

import type { IConnectionAccessTabState } from './IConnectionAccessTabState.js';

interface State extends ILoadableState {
  state: IConnectionAccessTabState;
  changed: boolean;
  edit: () => void;
  revoke: (subjectIds: string[]) => void;
  grant: (subjectIds: string[]) => void;
  load: () => Promise<void>;
}

export function useConnectionAccessState(connection: DatabaseConnectionFragment | undefined): Readonly<State> {
  const resource = useService(ConnectionInfoResource);
  const notificationService = useService(NotificationService);
  const state = useTabState<IConnectionAccessTabState>();

  return useObservableRef(
    () => ({
      exception: null as Error | null,
      get changed() {
        return !isArraysEqual(this.state.initialGrantedSubjects, this.state.grantedSubjects);
      },
      isLoading() {
        return this.state.loading;
      },
      isError() {
        return isContainsException(this.exception);
      },
      isLoaded() {
        return this.state.loaded;
      },
      edit() {
        this.state.editing = !this.state.editing;
      },
      revoke(subjectIds: string[]) {
        this.state.grantedSubjects = this.state.grantedSubjects.filter(subject => !subjectIds.includes(subject));
      },
      grant(subjectIds: string[]) {
        this.state.grantedSubjects.push(...subjectIds);
      },
      async load(reload = false) {
        let loaded = this.exception || this.state.loaded;

        if (reload) {
          loaded = false;
        }

        if (loaded || this.state.loading) {
          return;
        }

        try {
          this.state.loading = true;

          if (this.connection) {
            const key = createConnectionParam(this.connection);
            const grantedSubjects = await this.resource.loadAccessSubjects(key);
            this.state.grantedSubjects = grantedSubjects.map(subject => subject.subjectId);
            this.state.initialGrantedSubjects = this.state.grantedSubjects.slice();
          }

          this.state.loaded = true;
          this.exception = null;
        } catch (exception: any) {
          this.notificationService.logException(exception, 'connections_connection_edit_access_load_failed');
          this.exception = exception;
        } finally {
          this.state.loading = false;
        }
      },
      async reload() {
        this.load(true);
      },
    }),
    {
      exception: observable.ref,
      state: observable.ref,
      changed: computed,
      edit: action.bound,
      isLoading: action.bound,
      isLoaded: action.bound,
      reload: action.bound,
      revoke: action.bound,
      grant: action.bound,
    },
    { state, connection, resource, notificationService },
    ['load'],
  );
}
