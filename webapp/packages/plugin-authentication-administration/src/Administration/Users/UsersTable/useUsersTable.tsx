/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { action, computed, observable } from 'mobx';

import { AdminUser, compareUsers, UsersResource, UsersResourceFilterKey, UsersResourceNewUsers } from '@cloudbeaver/core-authentication';
import { TableState, useObservableRef, usePagination, useResource, useTranslate } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { CommonDialogService, ConfirmationDialogDelete, DialogueStateResult } from '@cloudbeaver/core-dialogs';
import { NotificationService } from '@cloudbeaver/core-events';
import { resourceKeyList } from '@cloudbeaver/core-sdk';
import { ILoadableState, isArraysEqual, isDefined } from '@cloudbeaver/core-utils';

import type { IUserFilters } from './Filters/useUsersTableFilters';

interface State {
  loading: boolean;
  readonly hasMore: boolean;
  state: TableState;
  users: AdminUser[];
  loadableState: ILoadableState;
  loadMore(): void;
  update: () => Promise<void>;
  delete: () => Promise<void>;
}

export function useUsersTable(filters: IUserFilters) {
  const translate = useTranslate();
  const usersResource = useService(UsersResource);
  const pagination = usePagination(UsersResource, {
    key: UsersResourceFilterKey(filters.search, filters.status === 'true' ? true : filters.status === 'false' ? false : undefined),
  });
  const usersLoader = useResource(useUsersTable, usersResource, pagination.key);
  const notificationService = useService(NotificationService);
  const commonDialogService = useService(CommonDialogService);

  const state: State = useObservableRef(
    () => ({
      loading: false,
      state: new TableState(),
      get hasMore() {
        return pagination.hasNextPage;
      },
      get users() {
        const users = Array.from(
          new Set([...this.usersLoader.resource.get(UsersResourceNewUsers), ...usersLoader.tryGetData.filter(isDefined).sort(compareUsers)]),
        );
        return filters.filterUsers(users.filter(isDefined));
      },
      async update() {
        try {
          pagination.refresh();
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
          await this.usersLoader.resource.delete(resourceKeyList(deletionList));
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
      loadMore() {
        pagination.loadMore();
      },
    }),
    {
      loading: observable.ref,
      usersLoader: observable.ref,
      loadableState: observable.ref,
      users: computed<AdminUser[]>({ equals: (first, second) => isArraysEqual(first, second, undefined, true) }),
      update: action.bound,
      delete: action.bound,
      loadMore: action.bound,
    },
    { usersLoader, loadableState: usersLoader },
  );

  return state;
}
