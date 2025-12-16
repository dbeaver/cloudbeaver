/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { action, computed, observable } from 'mobx';

import { type AdminUser, compareUsers, compareNewUsers, UsersResource, UsersResourceFilterKey } from '@cloudbeaver/core-authentication';
import { TableState, useObservableRef, useOffsetPagination, useResource } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { type ILoadableState, isArraysEqual } from '@cloudbeaver/core-utils';
import { isDefined } from '@dbeaver/js-helpers';

import type { IUserFilters } from './Filters/useUsersTableFilters.js';

interface State {
  readonly hasMore: boolean;
  users: AdminUser[];
  loadableState: ILoadableState;
  loadMore(): void;
  update: () => void;
}

export function useUsersTable(filters: IUserFilters) {
  const usersResource = useService(UsersResource);
  const searchFilter = filters.search.trim().toLowerCase();
  const enabledStateFilter = filters.status === 'true' ? true : filters.status === 'false' ? false : undefined;
  const pagination = useOffsetPagination(UsersResource, {
    key: UsersResourceFilterKey(searchFilter, enabledStateFilter),
  });
  const usersLoader = useResource(useUsersTable, usersResource, pagination.currentPage);
  const notificationService = useService(NotificationService);

  const state: State = useObservableRef(
    () => ({
      loading: false,
      state: new TableState(),
      get hasMore() {
        return pagination.hasNextPage;
      },
      get users() {
        usersLoader.data; // triggers suspense, behaves differently than forceSuspense action cause used on the getter level

        return filters.filterUsers(
          Array.from(
            new Set([
              ...this.usersLoader.resource.get(UsersResourceFilterKey(searchFilter, enabledStateFilter)),
              ...usersResource.get(pagination.allPages),
            ]),
          )
            .filter(isDefined)
            .sort(compareUsers)
            .sort(compareNewUsers),
        );
      },
      update() {
        try {
          pagination.refresh();
          notificationService.logSuccess({ title: 'authentication_administration_tools_refresh_success' });
        } catch (exception: any) {
          notificationService.logException(exception, 'authentication_administration_tools_refresh_fail');
        }
      },
      loadMore() {
        pagination.loadMore();
      },
    }),
    {
      usersLoader: observable.ref,
      loadableState: observable.ref,
      users: computed<AdminUser[]>({ equals: (first, second) => isArraysEqual(first, second, undefined, true) }),
      update: action.bound,
      loadMore: action.bound,
    },
    { usersLoader, loadableState: usersLoader },
  );

  return state;
}
