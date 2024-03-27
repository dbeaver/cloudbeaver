/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { useEffect, useState } from 'react';

import { type ILoadableState, isContainsException } from '@cloudbeaver/core-utils';

import { getComputed } from '../getComputed';

export function useAutoLoad(
  component: { name: string },
  state: ILoadableState | ILoadableState[],
  enabled = true,
  lazy = false,
  throwExceptions = false,
) {
  const [loadFunctionName] = useState(`${component.name}.useAutoLoad(...)` as const);
  if (!Array.isArray(state)) {
    state = [state];
  }

  for (const loader of state as ILoadableState[]) {
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

      for (const loader of state as ILoadableState[]) {
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

  if (throwExceptions) {
    const exceptions = state
      .map(loader => loader.exception)
      .filter(isContainsException)
      .flat();

    if (exceptions.length > 0) {
      throw exceptions[0];
    }
  }

  useEffect(() => {
    obj[loadFunctionName]();
  });
}
