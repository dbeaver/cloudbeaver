/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { action, observable } from 'mobx';

import { ConfirmationDialogDelete, useObservableRef, useTranslate } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { CommonDialogService, DialogueStateResult } from '@cloudbeaver/core-dialogs';
import { NotificationService } from '@cloudbeaver/core-events';
import { CachedMapAllKey } from '@cloudbeaver/core-resource';
import type { ITableSelection } from '@cloudbeaver/plugin-data-grid';

import { AIProfilesResource } from './AIProfilesResource.js';

interface State {
  processing: boolean;
  aiProfilesResource: AIProfilesResource;
  notificationService: NotificationService;
  dialogService: CommonDialogService;
  selection: ITableSelection;
  refresh: () => Promise<void>;
  delete: () => Promise<void>;
}

export function useAIProfilesTable(selection: ITableSelection): Readonly<State> {
  const notificationService = useService(NotificationService);
  const dialogService = useService(CommonDialogService);
  const aiProfilesResource = useService(AIProfilesResource);
  const translate = useTranslate();

  return useObservableRef<State>(
    () => ({
      processing: false,
      async refresh() {
        if (this.processing) {
          return;
        }

        try {
          this.processing = true;
          await this.aiProfilesResource.refresh(CachedMapAllKey);
          this.notificationService.logSuccess({ title: 'plugin_ai_administration_profiles_refresh_success' });
        } catch (exception: any) {
          this.notificationService.logException(exception, 'plugin_ai_administration_profiles_refresh_error');
        } finally {
          this.processing = false;
        }
      },
      async delete() {
        if (this.processing) {
          return;
        }

        const deletionList = this.selection.selected;

        if (deletionList.length === 0) {
          return;
        }

        const names = deletionList.map(id => `"${this.aiProfilesResource.get(id)?.name ?? id}"`).join(', ');
        const message = `${translate('plugin_ai_administration_profile_delete_confirmation')}${names}.\n\n${translate('ui_are_you_sure')}`;

        const { status } = await this.dialogService.open(ConfirmationDialogDelete, {
          title: 'ui_data_delete_confirmation',
          message,
          confirmActionText: 'ui_delete',
        });

        if (status === DialogueStateResult.Rejected) {
          return;
        }

        try {
          this.processing = true;
          const results = await Promise.allSettled(deletionList.map(profileId => this.aiProfilesResource.deleteProfile(profileId)));
          const failed = results.filter((r): r is PromiseRejectedResult => r.status === 'rejected');

          if (failed.length === 0) {
            this.notificationService.logSuccess({ title: 'plugin_ai_administration_profile_delete_success' });
          } else {
            this.notificationService.logError({
              title: 'plugin_ai_administration_profile_delete_error',
              message: Array.from(new Set(failed.map(f => (f.reason instanceof Error ? f.reason.message : String(f.reason))))).join('\n'),
            });
          }

          this.selection.clear();
        } finally {
          this.processing = false;
        }
      },
    }),
    {
      processing: observable.ref,
      selection: observable.ref,
      refresh: action.bound,
      delete: action.bound,
    },
    { aiProfilesResource, selection, notificationService, dialogService },
  );
}
