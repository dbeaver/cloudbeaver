/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { action, observable } from 'mobx';

import type { AdminUser } from '@cloudbeaver/core-authentication';
import { useObservableRef } from '@cloudbeaver/core-blocks';
import type { TLocalizationToken } from '@cloudbeaver/core-localization';

type EnabledStatusType = 'true' | 'false' | 'all';

interface IStatus {
  label: TLocalizationToken;
  value: EnabledStatusType;
}

export const USER_ROLE_ALL = 'ALL';

export const USER_STATUSES: IStatus[] = [
  {
    label: 'authentication_administration_users_filters_status_enabled',
    value: 'true',
  },
  {
    label: 'authentication_administration_users_filters_status_disabled',
    value: 'false',
  },
  {
    label: 'authentication_administration_users_filters_status_all',
    value: 'all',
  },
];

export interface IUserFilters {
  search: string;
  role: string;
  status: EnabledStatusType;
  isSearching: boolean;
  filterUsers: (users: AdminUser[]) => AdminUser[];
  setSearch: (value: string) => void;
  setRole: (role: string) => void;
  setStatus: (status: EnabledStatusType) => void;
}

export function useUsersTableFilters() {
  const filters: IUserFilters = useObservableRef(
    () => ({
      search: '',
      role: USER_ROLE_ALL,
      status: 'true',
      get isSearching() {
        return this.search.trim() !== '';
      },
      filterUsers(users: AdminUser[]) {
        return users.filter(user => {
          const matchSearch = user.userId.toLowerCase().includes(this.search.trim().toLowerCase());
          const matchStatus = String(user.enabled) === this.status || this.status === 'all';
          const matchRole = this.role === USER_ROLE_ALL || this.role === user.authRole;

          return matchSearch && matchStatus && matchRole;
        });
      },
      setSearch(value: string) {
        this.search = value;
      },
      setRole(role: string) {
        this.role = role;
      },
      setStatus(status: EnabledStatusType) {
        this.status = status;
      },
    }),
    {
      search: observable.ref,
      role: observable.ref,
      status: observable.ref,
      setSearch: action.bound,
      setRole: action.bound,
      setStatus: action.bound,
    },
    false,
  );

  return filters;
}
