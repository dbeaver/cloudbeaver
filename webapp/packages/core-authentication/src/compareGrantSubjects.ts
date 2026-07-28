/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { compareUsersByLastLogin, isUser } from './compareUser.js';
import type { TeamInfo } from './TeamsResource.js';
import type { AdminUser } from './UsersResource.js';

export function compareGrantSubjectsByName(a: AdminUser | TeamInfo, b: AdminUser | TeamInfo): number {
  const aName = isUser(a) ? a.userId : a.teamName;
  const bName = isUser(b) ? b.userId : b.teamName;
  return (aName ?? '').localeCompare(bName ?? '');
}

export function compareGrantSubjectsByLastLogin(a: AdminUser | TeamInfo, b: AdminUser | TeamInfo): number {
  return compareUsersByLastLogin(
    { lastLoginTime: isUser(a) ? a.lastLoginTime : undefined },
    { lastLoginTime: isUser(b) ? b.lastLoginTime : undefined },
  );
}
