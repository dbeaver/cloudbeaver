/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { useContext } from 'react';

import { TreeSelectionContext } from './TreeSelectionContext.js';
import type { ITreeSelection } from '../useTreeSelection.js';

export function useTreeSelectionContext(): ITreeSelection {
  const context = useContext(TreeSelectionContext);
  if (!context) {
    throw new Error('useTreeSelectionContext must be used within a TreeSelectionContext.Provider');
  }
  return context;
}
