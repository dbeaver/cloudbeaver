/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useStoreState, type TabStoreState } from '@dbeaver/ui-kit';

import { useTabsStore } from './useTabsStore.js';

export function useTabsState<K extends keyof TabStoreState>(selector: K): TabStoreState[K] {
  const store = useTabsStore();
  return useStoreState(store, selector);
}
