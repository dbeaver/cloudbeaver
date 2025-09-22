/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { createContext, use } from 'react';

import type { ITreeMenu } from '../../useTreeMenu.js';

export const TreeMenuContext = createContext<ITreeMenu | null>(null);

export function useTreeMenuContext() {
  const context = use(TreeMenuContext);

  if (!context) {
    throw new Error('useTreeMenuContext must be used within a TreeMenuContextProvider.');
  }

  return context;
}
