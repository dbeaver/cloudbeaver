/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useContext } from 'react';

import type { MetadataValueGetter } from '@cloudbeaver/core-utils';

import { TabContext } from './TabContext';
import { TabsContext } from './TabsContext';

export function useTabLocalState<T>(valueGetter?: MetadataValueGetter<string, T>): T {
  const state = useContext(TabsContext);
  const tabContext = useContext(TabContext);
  if (!state || !tabContext) {
    throw new Error('Tabs context was not provided');
  }

  return state.getLocalState(tabContext.tabId, valueGetter);
}
