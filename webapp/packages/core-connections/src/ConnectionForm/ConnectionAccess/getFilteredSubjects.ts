/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { AdminRoleInfo, AdminUserInfoFragment } from '@cloudbeaver/core-sdk';

/**
 * @param  {AdminUserInfoFragment[]} users
 * @param  {string} filter
 */
export function getFilteredUsers(users: AdminUserInfoFragment[], filter: string): AdminUserInfoFragment[] {
  return users
    .filter(user => user.userId.toLowerCase().includes(filter.toLowerCase()))
    .sort((a, b) => (a.userId).localeCompare(b.userId));
}

/**
 * @param  {AdminRoleInfo[]} roles
 * @param  {string} filter
 */
export function getFilteredRoles(roles: AdminRoleInfo[], filter: string): AdminRoleInfo[] {
  return roles
    .filter(role => role.roleName?.toLowerCase().includes(filter.toLowerCase()) && role.roleId !== 'admin')
    .sort((a, b) => (a.roleName ?? '').localeCompare(b.roleName ?? ''));
}
