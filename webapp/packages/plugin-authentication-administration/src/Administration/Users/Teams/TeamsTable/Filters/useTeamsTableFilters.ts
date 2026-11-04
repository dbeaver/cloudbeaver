/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { action, computed, observable } from 'mobx';

import type { TeamInfo } from '@cloudbeaver/core-authentication';
import { useObservableRef } from '@cloudbeaver/core-blocks';
import { isArraysEqual } from '@cloudbeaver/core-utils';

export interface ITeamFilters {
  search: string;
  filteredTeams: TeamInfo[];
  setSearch: (value: string) => void;
}

export function useTeamsTableFilters(teams: TeamInfo[]): ITeamFilters {
  const filters: ITeamFilters = useObservableRef(
    () => ({
      search: '',
      get filteredTeams() {
        const search = this.search.trim().toLowerCase();

        return this.teams.filter(team => [team.teamId, team.teamName, team.description].some(value => value?.toLowerCase().includes(search)));
      },
      setSearch(value: string) {
        this.search = value;
      },
    }),
    {
      search: observable.ref,
      teams: observable.ref,
      filteredTeams: computed<TeamInfo[]>({ equals: (first, second) => isArraysEqual(first, second, undefined, true) }),
      setSearch: action.bound,
    },
    { teams },
  );

  return filters;
}
