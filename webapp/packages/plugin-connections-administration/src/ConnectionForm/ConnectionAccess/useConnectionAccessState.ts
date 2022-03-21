/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { action, computed, observable } from 'mobx';

import { useTabState } from '@cloudbeaver/core-ui';
import { useObservableRef } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import type { DatabaseConnectionFragment } from '@cloudbeaver/core-sdk';
import { isArraysEqual } from '@cloudbeaver/core-utils';

import { ConnectionsResource } from '../../Administration/ConnectionsResource';
import type { IConnectionAccessTabState } from './IConnectionAccessTabState';

interface State {
  state: IConnectionAccessTabState;
  changed: boolean;
  edit: () => void;
  revoke: (subjectIds: string[]) => void;
  grant: (subjectIds: string[]) => void;
  load: () => Promise<void>;
}

export function useConnectionAccessState(connection: DatabaseConnectionFragment | undefined): Readonly<State> {
  const resource = useService(ConnectionsResource);
  const notificationService = useService(NotificationService);
  const state = useTabState<IConnectionAccessTabState>();

  return useObservableRef(() => ({
    get changed() {
      return !isArraysEqual(this.state.initialGrantedSubjects, this.state.grantedSubjects);
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
    async load() {
      if (this.state.loaded || this.state.loading) {
        return;
      }

      try {
        this.state.loading = true;

        if (this.connection) {
          const grantedSubjects = await this.resource.loadAccessSubjects(this.connection.id);
          this.state.grantedSubjects = grantedSubjects.map(subject => subject.subjectId);
          this.state.initialGrantedSubjects = this.state.grantedSubjects.slice();
        }

        this.state.loaded = true;
      } catch (exception: any) {
        this.notificationService.logException(exception, 'connections_connection_edit_access_load_failed');
      } finally {
        this.state.loading = false;
      }
    },
  }),
  { state: observable.ref, changed: computed, edit: action.bound, revoke: action.bound, grant: action.bound },
  { state, connection, resource, notificationService },
  ['load']);
}
