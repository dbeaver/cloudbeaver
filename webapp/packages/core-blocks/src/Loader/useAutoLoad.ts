/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useEffect } from 'react';

import type { ILoadableState } from './ILoadableState';

export interface IAutoLoadable extends ILoadableState {
  load: () => void;
}

export function useAutoLoad(state: IAutoLoadable, enabled = true) {
  const load = enabled && !state.isLoaded();

  useEffect(() => {
    if (load) {
      state.load();
    }
  }, [state, load]);
}