/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { TeamInfo } from '@cloudbeaver/core-authentication';
import type { AdminUserInfoFragment } from '@cloudbeaver/core-sdk';

/**
 * @param  {AdminUserInfoFragment[]} users
 * @param  {string} filter
 */
export function getFilteredUsers(users: AdminUserInfoFragment[], filter: string): AdminUserInfoFragment[] {
  return users
    .filter(user => user.enabled && user.userId.toLowerCase().includes(filter.toLowerCase()))
    .sort((a, b) => a.userId.localeCompare(b.userId));
}

/**
 * @param  {AdminTeamInfo[]} teams
 * @param  {string} filter
 */
export function getFilteredTeams(teams: TeamInfo[], filter: string): TeamInfo[] {
  return teams
    .filter(team => team.teamName?.toLowerCase().includes(filter.toLowerCase()) && team.teamId !== 'admin')
    .sort((a, b) => (a.teamName ?? '').localeCompare(b.teamName ?? ''));
}
