/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useTabContext, type TabStore } from '@dbeaver/ui-kit';

export function useTabsStore(): TabStore {
  const store = useTabContext();

  if (!store) {
    throw new Error('useTabsStore must be used within a TabProvider');
  }

  return store;
}
