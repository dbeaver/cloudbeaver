/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { action, observable } from 'mobx';

import { TeamsResource } from '@cloudbeaver/core-authentication';
import { ConfirmationDialogDelete, useObservableRef, useTranslate } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { CommonDialogService, DialogueStateResult } from '@cloudbeaver/core-dialogs';
import { NotificationService } from '@cloudbeaver/core-events';
import { CachedMapAllKey, resourceKeyList } from '@cloudbeaver/core-resource';
import type { ITableSelection } from '@cloudbeaver/plugin-data-grid';

interface State {
  processing: boolean;
  teamsResource: TeamsResource;
  selection: ITableSelection;
  update: () => Promise<void>;
  delete: () => Promise<void>;
}

export function useTeamsTable(selection: ITableSelection): Readonly<State> {
  const notificationService = useService(NotificationService);
  const dialogService = useService(CommonDialogService);
  const teamsResource = useService(TeamsResource);

  const translate = useTranslate();

  return useObservableRef<State>(
    () => ({
      processing: false,
      async update() {
        if (this.processing) {
          return;
        }

        try {
          this.processing = true;
          await this.teamsResource.refresh(CachedMapAllKey);
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

        const deletionList = this.selection.list;

        if (deletionList.length === 0) {
          return;
        }

        const teamNames = deletionList.map(name => `"${name}"`).join(', ');
        const message = `${translate('administration_teams_delete_confirmation')}${teamNames}.\n\n${translate(
          'administration_teams_delete_confirmation_users_note',
        )}.\n\n${translate('ui_are_you_sure')}`;
        const { status } = await dialogService.open(ConfirmationDialogDelete, {
          title: 'ui_data_delete_confirmation',
          message,
          confirmActionText: 'ui_delete',
        });

        if (status === DialogueStateResult.Rejected) {
          return;
        }

        try {
          this.processing = true;
          await this.teamsResource.deleteTeam(resourceKeyList(deletionList), { force: true });

          this.selection.clear();
        } catch (exception: any) {
          notificationService.logException(exception, 'Teams delete Error');
        } finally {
          this.processing = false;
        }
      },
    }),
    {
      processing: observable.ref,
      selection: observable.ref,
      update: action.bound,
      delete: action.bound,
    },
    { teamsResource, selection },
  );
}
