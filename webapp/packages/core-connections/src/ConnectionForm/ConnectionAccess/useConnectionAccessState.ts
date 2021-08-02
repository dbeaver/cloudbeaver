/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useObjectRef, useTabState } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import type { DatabaseConnectionFragment } from '@cloudbeaver/core-sdk';

import { ConnectionsResource } from '../../Administration/ConnectionsResource';
import type { IConnectionAccessTabState } from './IConnectionAccessTabState';

interface IConnectionAccessState {
  state: IConnectionAccessTabState;
  revoke: (subjectIds: string[]) => void;
  grant: (subjectIds: string[]) => void;
  edit: () => void;
  load: () => Promise<void>;
}

export function useConnectionAccessState(connection: DatabaseConnectionFragment | undefined): IConnectionAccessState {
  const connectionsResource = useService(ConnectionsResource);
  const notificationService = useService(NotificationService);
  const state = useTabState<IConnectionAccessTabState>();

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
    if (state.loaded) {
      return;
    }

    try {
      state.loading = true;

      if (connection) {
        const grantedSubjects = await connectionsResource.loadAccessSubjects(connection.id);
        state.grantedSubjects = grantedSubjects.map(subject => subject.subjectId);
        state.initialGrantedSubjects = state.grantedSubjects.slice();
      }

      state.loaded = true;
    } catch (exception) {
      notificationService.logException(exception, 'connections_connection_edit_access_load_failed');
    }
    state.loading = false;
  };

  return useObjectRef({ state, revoke, grant, edit, load });
}
