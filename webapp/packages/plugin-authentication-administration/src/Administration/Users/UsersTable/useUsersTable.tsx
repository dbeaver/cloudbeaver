/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { action, computed, observable } from 'mobx';

import type { AdminUser, UsersResource } from '@cloudbeaver/core-authentication';
import { TableState, useObservableRef, useTranslate } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { CommonDialogService, ConfirmationDialogDelete, DialogueStateResult } from '@cloudbeaver/core-dialogs';
import { NotificationService } from '@cloudbeaver/core-events';
import { resourceKeyList } from '@cloudbeaver/core-sdk';
import { isArraysEqual } from '@cloudbeaver/core-utils';

interface State {
  loading: boolean;
  state: TableState;
  users: AdminUser[];
  update: () => Promise<void>;
  delete: () => Promise<void>;
}

export function useUsersTable(usersResource: UsersResource) {
  const translate = useTranslate();
  const notificationService = useService(NotificationService);
  const commonDialogService = useService(CommonDialogService);

  const state: State = useObservableRef(() => ({
    loading: false,
    state: new TableState(),
    get users() {
      return this.usersResource.values
        .slice()
        .sort((a, b) => {
          if (this.usersResource.isNew(a.userId) === this.usersResource.isNew(b.userId)) {
            return a.userId.localeCompare(b.userId);
          }
          if (this.usersResource.isNew(a.userId)) {
            return -1;
          }
          return 1;
        });
    },
    async update() {
      try {
        await this.usersResource.refreshAll();
        notificationService.logSuccess({ title: 'authentication_administration_tools_refresh_success' });
      } catch (exception: any) {
        notificationService.logException(exception, 'authentication_administration_tools_refresh_fail');
      }
    },
    async delete() {
      if (this.loading) {
        return;
      }

      const deletionList = this.state.selectedList.filter(([_, value]) => value).map(([userId]) => userId);
      if (deletionList.length === 0) {
        return;
      }

      const userNames = deletionList.map(name => `"${name}"`).join(', ');
      const message = `${translate('authentication_administration_users_delete_confirmation')}${userNames}. ${translate('ui_are_you_sure')}`;

      const result = await commonDialogService.open(ConfirmationDialogDelete, {
        title: 'ui_data_delete_confirmation',
        message,
        confirmActionText: 'ui_delete',
      });

      if (result === DialogueStateResult.Rejected) {
        return;
      }

      this.loading = true;

      try {
        await this.usersResource.delete(resourceKeyList(deletionList));
        this.state.unselect();

        for (const id of deletionList) {
          this.state.unexpand(id);
        }
      } catch (exception: any) {
        notificationService.logException(exception, 'authentication_administration_user_delete_fail');

      } finally {
        this.loading = false;
      }
    },
  }), {
    loading: observable.ref,
    users: computed<AdminUser[]>({ equals: (first, second) => isArraysEqual(first, second, undefined, true) }),
    update: action.bound,
    delete: action.bound,
  }, { usersResource });

  return state;
}