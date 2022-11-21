/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { action, computed, observable } from 'mobx';

import { useObservableRef } from '@cloudbeaver/core-blocks';
import type { TLocalizationToken } from '@cloudbeaver/core-localization';
import type { AdminUser } from '@cloudbeaver/core-authentication';
import { isArraysEqual } from '@cloudbeaver/core-utils';

export enum EUserStatus {
  ENABLED = 'ENABLED',
  DISABLED = 'DISABLED',
  ALL = 'ALL'
}

interface IStatus {
  label: TLocalizationToken;
  value: EUserStatus;
}

export const USER_ROLE_ALL = 'ALL';

export const USER_STATUSES: IStatus[] = [
  {
    label: 'authentication_administration_users_filters_status_enabled',
    value: EUserStatus.ENABLED,
  },
  {
    label: 'authentication_administration_users_filters_status_disabled',
    value: EUserStatus.DISABLED,
  },
  {
    label: 'authentication_administration_users_filters_status_all',
    value: EUserStatus.ALL,
  },
];

export interface IUserFilters {
  search: string;
  role: string;
  status: EUserStatus;
  filteredUsers: AdminUser[];
  setSearch: (value: string) => void;
  setRole: (role: string) => void;
  setStatus: (status: EUserStatus) => void;
}

export function useUsersTableFilters(users: AdminUser[]) {
  const filters: IUserFilters = useObservableRef(() => ({
    search: '',
    role: USER_ROLE_ALL,
    status: EUserStatus.ENABLED,
    get filteredUsers() {
      return this.users.filter(user => {
        const matchSearch = user.userId.toLowerCase().includes(this.search.trim().toLowerCase());
        const matchStatus = this.status === EUserStatus.ALL
          || (this.status === EUserStatus.ENABLED ? user.enabled : !user.enabled);
        const matchRole = this.role === USER_ROLE_ALL || this.role === user.authRole;

        return matchSearch && matchStatus && matchRole;
      })
    },
    setSearch(value: string) {
      this.search = value;
    },
    setRole(role: string) {
      this.role = role;
    },
    setStatus(status: EUserStatus) {
      this.status = status;
    },
  }), {
    search: observable.ref,
    role: observable.ref,
    status: observable.ref,
    users: observable.ref,
    filteredUsers: computed<AdminUser[]>({ equals: (first, second) => isArraysEqual(first, second, undefined, true) }),
    setSearch: action.bound,
    setRole: action.bound,
    setStatus: action.bound,
  }, { users });

  return filters;
}