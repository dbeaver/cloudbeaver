/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { computed, observable } from 'mobx';

import { compareTeams, type TeamInfo, TeamsResource } from '@cloudbeaver/core-authentication';
import { ConfirmationDialogDelete, TableState, useObservableRef, useResource, useTranslate } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { CommonDialogService, DialogueStateResult } from '@cloudbeaver/core-dialogs';
import { NotificationService } from '@cloudbeaver/core-events';
import { CachedMapAllKey, resourceKeyList } from '@cloudbeaver/core-resource';
import type { ILoadableState } from '@cloudbeaver/core-utils';

interface State {
  tableState: TableState;
  processing: boolean;
  teams: TeamInfo[];
  state: ILoadableState;
  update: () => Promise<void>;
  delete: () => Promise<void>;
}

export function useTeamsTable(): Readonly<State> {
  const notificationService = useService(NotificationService);
  const dialogService = useService(CommonDialogService);
  const resource = useResource(useTeamsTable, TeamsResource, CachedMapAllKey);

  const translate = useTranslate();

  return useObservableRef<State>(
    () => ({
      tableState: new TableState(),
      processing: false,
      state: resource,
      get teams() {
        return resource.resource.values.slice().sort(compareTeams);
      },
      async update() {
        if (this.processing) {
          return;
        }

        try {
          this.processing = true;
          await resource.resource.refresh(CachedMapAllKey);
          notificationService.logSuccess({ title: 'administration_teams_team_list_update_success' });
        } catch (exception: any) {
          notificationService.logException(exception, 'administration_teams_team_list_update_fail');
        } finally {
          this.processing = false;
        }
      },
      async delete() {
        if (this.processing) {
          return;
        }

        const deletionList = this.tableState.selectedList;

        if (deletionList.length === 0) {
          return;
        }

        const teamNames = deletionList.map(name => `"${name}"`).join(', ');
        const message = `${translate('administration_teams_delete_confirmation')}${teamNames}.\n\n${translate(
          'administration_teams_delete_confirmation_users_note',
        )}.\n\n${translate('ui_are_you_sure')}`;
        const result = await dialogService.open(ConfirmationDialogDelete, {
          title: 'ui_data_delete_confirmation',
          message,
          confirmActionText: 'ui_delete',
        });

        if (result === DialogueStateResult.Rejected) {
          return;
        }

        try {
          this.processing = true;
          await resource.resource.deleteTeam(resourceKeyList(deletionList), { force: true });

          this.tableState.unselect();
          this.tableState.collapse(deletionList);
        } catch (exception: any) {
          notificationService.logException(exception, 'Teams delete Error');
        } finally {
          this.processing = false;
        }
      },
    }),
    {
      processing: observable.ref,
      teams: computed,
    },
    false,
    ['update', 'delete'],
  );
}
