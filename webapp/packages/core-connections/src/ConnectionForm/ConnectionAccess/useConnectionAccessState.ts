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
import { AdminSubjectType } from '@cloudbeaver/core-sdk';

import { ConnectionsResource } from '../../Administration/ConnectionsResource';
import type { IConnectionFormState } from '../ConnectionFormService';
import type { IConnectionAccessTabState } from './IConnectionAccessTabState';

interface IConnectionAccessState {
  state: IConnectionAccessTabState;
  select: (subjectId: string, value: boolean) => void;
  load: () => Promise<void>;
}

export function useConnectionAccessState(formState: IConnectionFormState): IConnectionAccessState {
  const connectionsResource = useService(ConnectionsResource);
  const notificationService = useService(NotificationService);
  const state = useTabState<IConnectionAccessTabState>();

  const select = (subjectId: string, value: boolean): void => {
    if (!value) {
      const index = state.grantedSubjects.findIndex(subject => subject.subjectId === subjectId);
      if (index > -1) {
        state.grantedSubjects.splice(index, 1);
      }
      return;
    }

    state.grantedSubjects.push({
      connectionId: '',
      subjectId,
      subjectType: AdminSubjectType.User,
    });
  };

  const load = async () => {
    if (state.loaded) {
      return;
    }

    try {
      state.loading = true;

      if (formState.info) {
        state.grantedSubjects = await connectionsResource.loadAccessSubjects(formState.info.id);
      }

      for (const subject of state.grantedSubjects) {
        state.selectedSubjects.set(subject.subjectId, true);
      }
      state.loaded = true;
    } catch (exception) {
      notificationService.logException(exception, 'connections_connection_edit_access_load_failed');
    }
    state.loading = false;
  };

  return useObjectRef({ state, select, load });
}
