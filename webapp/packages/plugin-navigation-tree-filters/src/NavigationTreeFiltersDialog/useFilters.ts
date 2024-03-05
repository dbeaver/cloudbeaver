/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { action, observable } from 'mobx';

import { useObservableRef } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { NavNodeInfoResource } from '@cloudbeaver/core-navigation-tree';
import type { NavigatorNodeFilter } from '@cloudbeaver/core-sdk';
import type { ILoadableState } from '@cloudbeaver/core-utils';

interface State extends ILoadableState {
  filters: Required<NavigatorNodeFilter>;
  navNodeInfoResource: NavNodeInfoResource;
  nodePath: string;
  loading: boolean;
  loaded: boolean;
  exception: Error | null;
  load: () => Promise<void>;
  include: (value: string | string[]) => void;
  exclude: (value: string | string[]) => void;
  deleteInclude: (value: string) => void;
  deleteExclude: (value: string) => void;
}

export function useFilters(nodePath: string) {
  const navNodeInfoResource = useService(NavNodeInfoResource);

  const state = useObservableRef<State>(
    () => ({
      filters: { exclude: [], include: [] },
      loading: false,
      loaded: false,
      exception: null,
      isLoading() {
        return this.loading;
      },
      isLoaded() {
        return this.loaded;
      },
      isError() {
        return !!this.exception;
      },
      async load() {
        if (this.loaded || this.loading) {
          return;
        }

        try {
          this.loading = true;
          const filters = await this.navNodeInfoResource.loadNodeFilter(this.nodePath);

          if (filters?.exclude) {
            this.exclude(filters.exclude);
          }

          if (filters?.include) {
            this.include(filters.include);
          }
          this.loaded = true;
        } catch (exception: any) {
          this.exception = exception;
        } finally {
          this.loading = false;
        }
      },
      deleteInclude(value: string) {
        this.filters.include = this.filters.include.filter(filter => filter !== value);
      },
      deleteExclude(value: string) {
        this.filters.exclude = this.filters.exclude.filter(filter => filter !== value);
      },
      include(value) {
        if (Array.isArray(value)) {
          this.filters.include.push(...value);
        } else {
          if (!this.filters.include.includes(value)) {
            this.filters.include.unshift(value);
          }
        }
      },
      exclude(value) {
        if (Array.isArray(value)) {
          this.filters.exclude.push(...value);
        } else {
          if (!this.filters.exclude.includes(value)) {
            this.filters.exclude.unshift(value);
          }
        }
      },
    }),
    {
      loading: observable.ref,
      loaded: observable.ref,
      exception: observable.ref,
      filters: observable,
      load: action.bound,
      include: action.bound,
      exclude: action.bound,
      deleteInclude: action.bound,
      deleteExclude: action.bound,
    },
    { nodePath, navNodeInfoResource },
  );

  return state;
}
