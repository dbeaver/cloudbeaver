/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { Resource, ResourceKey } from '@cloudbeaver/core-resource';
import { useObjectRef } from '../useObjectRef.js';
import { toJS } from 'mobx';
import { useEffect } from 'react';

export function useResourceTracker<TKey>(resource: Resource<any, TKey, any, any>, key: ResourceKey<TKey> | null = null): void {
  const state = useObjectRef(
    () => ({
      key: null as ResourceKey<TKey> | null,
      id: null as string | null,
      use(key: ResourceKey<TKey> | null): void {
        key = toJS(key);
        if (key !== null && this.key !== null && this.resource.isEqual(key, this.key)) {
          return;
        }

        this.free();
        this.id = key === null ? null : this.resource.useTracker.use(key);
        this.key = key;
      },
      free() {
        if (this.key !== null && this.id !== null && this.resource.useTracker.hasUseId(this.id)) {
          this.resource.useTracker.free(this.key, this.id);
          this.key = null;
          this.id = null;
        }
      },
    }),
    {
      resource,
    },
    ['use'],
  );

  useEffect(() => {
    state.use(key);
    return () => {
      state.free();
    };
  }, [resource, key]);
}
