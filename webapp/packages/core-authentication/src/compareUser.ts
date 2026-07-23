/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { AUTH_PROVIDER_LOCAL_ID } from './AUTH_PROVIDER_LOCAL_ID.js';
import type { AdminUser } from './UsersResource.js';

export const NEW_USER_SYMBOL = Symbol('new-user');

export type AdminUserNew = AdminUser & { [NEW_USER_SYMBOL]: boolean; createdAt: number };

export function isLocalUser(user: AdminUser): boolean {
  return user.origins.some(origin => origin.type === AUTH_PROVIDER_LOCAL_ID);
}

export function isNewUser(user: AdminUser | AdminUserNew): user is AdminUserNew {
  return NEW_USER_SYMBOL in user && user[NEW_USER_SYMBOL] === true && 'createdAt' in user && Boolean(user.createdAt);
}

export function isUser(user: unknown): user is AdminUser {
  return !!user && typeof user === 'object' && 'userId' in user && 'grantedTeams' in user && 'enabled' in user;
}

export function compareUsersById<T extends Pick<AdminUser, 'userId'>>(a: T, b: T): number {
  return a.userId.localeCompare(b.userId);
}

export function compareUsersByLastLogin<T extends Pick<AdminUser, 'lastLoginTime'>>(a: T, b: T): number {
  const aTime = a.lastLoginTime ? new Date(a.lastLoginTime).getTime() : 0;
  const bTime = b.lastLoginTime ? new Date(b.lastLoginTime).getTime() : 0;
  return aTime - bTime;
}

export function compareUsersByNewness<T extends AdminUser>(a: T, b: T): number {
  const aIsNew = isNewUser(a);
  const bIsNew = isNewUser(b);

  if (aIsNew && !bIsNew) {
    return -1;
  }

  if (!aIsNew && bIsNew) {
    return 1;
  }

  if (aIsNew && bIsNew) {
    return b.createdAt - a.createdAt;
  }

  return 0;
}
