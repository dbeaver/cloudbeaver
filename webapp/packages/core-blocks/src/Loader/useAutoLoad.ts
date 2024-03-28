/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { useEffect, useState } from 'react';

import type { ILoadableState } from '@cloudbeaver/core-utils';

import { getComputed } from '../getComputed';

export function useAutoLoad(component: { name: string }, state: ILoadableState | ReadonlyArray<ILoadableState>, enabled = true, lazy = false) {
  const [loadFunctionName] = useState(`${component.name}.useAutoLoad(...)` as const);
  if (!Array.isArray(state)) {
    state = [state] as ReadonlyArray<ILoadableState>;
  }

  for (const loader of state as ReadonlyArray<ILoadableState>) {
    getComputed(
      // activate mobx subscriptions
      () => (!loader.isLoaded() || loader.isOutdated?.() === true) && !loader.isError(),
    );
  }

  const obj = {
    [loadFunctionName]: async () => {
      if (!enabled) {
        return;
      }

      for (const loader of state as ReadonlyArray<ILoadableState>) {
        if (loader.isError() || (loader.lazy === true && !lazy)) {
          continue;
        }

        if (!loader.isLoaded() || loader.isOutdated?.() === true) {
          try {
            await loader.load();
          } catch {}
        }
      }
    },
  };

  const promises = state.map(loader => loader.promise).filter(Boolean) as Promise<any>[];

  if (promises.length > 0) {
    throw Promise.all(promises);
  }

  useEffect(() => {
    obj[loadFunctionName]();
  });
}
