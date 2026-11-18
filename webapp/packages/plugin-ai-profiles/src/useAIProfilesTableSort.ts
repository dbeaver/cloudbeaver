/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { action, computed, observable } from 'mobx';

import { useObservableRef } from '@cloudbeaver/core-blocks';

import type { AIProfile } from './AIProfilesResource.js';

interface SortColumn {
  key: string;
  compare?: (a: AIProfile, b: AIProfile) => number;
}

interface AIProfilesTableSort {
  sort: { key: string; order: 'asc' | 'desc' } | null;
  readonly sortedProfiles: AIProfile[];
  setSort: (colIdx: number, order: 'asc' | 'desc' | null) => void;
}

export function useAIProfilesTableSort(profiles: AIProfile[], columns: SortColumn[]): AIProfilesTableSort {
  return useObservableRef(
    () => ({
      sort: null as { key: string; order: 'asc' | 'desc' } | null,
      get sortedProfiles() {
        const sort = this.sort;
        const compare = this.columns.find(column => column.key === sort?.key)?.compare;

        return sort && compare ? this.profiles.toSorted((a, b) => (sort.order === 'asc' ? compare(a, b) : compare(b, a))) : this.profiles;
      },
      setSort(colIdx: number, order: 'asc' | 'desc' | null) {
        const column = this.columns[colIdx];
        this.sort = order && column?.compare ? { key: column.key, order } : null;
      },
    }),
    {
      sort: observable.ref,
      profiles: observable.ref,
      columns: observable.ref,
      sortedProfiles: computed,
      setSort: action.bound,
    },
    { profiles, columns },
  );
}
