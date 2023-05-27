/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { useEffect } from 'react';

import { ILoadableState, isLoadableStateHasException } from '@cloudbeaver/core-utils';

import { getComputed } from '../getComputed';

export interface IAutoLoadable extends ILoadableState {
  load: () => void;
}

export function useAutoLoad(state: IAutoLoadable | IAutoLoadable[], enabled = true, lazy = false) {
  if (!Array.isArray(state)) {
    state = [state];
  }

  for (const loader of state as IAutoLoadable[]) {
    getComputed(
      // activate mobx subscriptions
      () => (!loader.isLoaded() || loader.isOutdated?.() === true) && !isLoadableStateHasException(loader),
    );
  }

  useEffect(() => {
    if (!enabled) {
      return;
    }

    for (const loader of state as IAutoLoadable[]) {
      if (isLoadableStateHasException(loader) || (loader.lazy === true && !lazy)) {
        continue;
      }

      if (!loader.isLoaded() || loader.isOutdated?.() === true) {
        loader.load();
      }
    }
  });
}
