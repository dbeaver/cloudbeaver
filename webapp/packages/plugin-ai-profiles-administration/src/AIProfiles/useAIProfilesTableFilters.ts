/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { action, computed, observable } from 'mobx';

import { useObservableRef } from '@cloudbeaver/core-blocks';
import { isArraysEqual } from '@cloudbeaver/core-utils';
import type { AIProfile } from '@cloudbeaver/plugin-ai-profiles';

export interface IAIProfileFilters {
  search: string;
  filteredProfiles: AIProfile[];
  setSearch: (value: string) => void;
}

export function useAIProfilesTableFilters(profiles: AIProfile[]): IAIProfileFilters {
  return useObservableRef(
    () => ({
      search: '',
      get filteredProfiles() {
        const search = this.search.trim().toLowerCase();

        return this.profiles.filter(profile => [profile.id, profile.name, profile.engineId].some(value => value.toLowerCase().includes(search)));
      },
      setSearch(value: string) {
        this.search = value;
      },
    }),
    {
      search: observable.ref,
      profiles: observable.ref,
      filteredProfiles: computed<AIProfile[]>({ equals: (first, second) => isArraysEqual(first, second, undefined, true) }),
      setSearch: action.bound,
    },
    { profiles },
  );
}
