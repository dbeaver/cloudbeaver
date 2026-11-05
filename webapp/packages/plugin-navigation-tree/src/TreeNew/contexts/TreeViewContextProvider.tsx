/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { use, type PropsWithChildren } from 'react';

import { useCaptureViewContext } from '@cloudbeaver/core-view';

import { DATA_CONTEXT_TREE_DATA } from '../DATA_CONTEXT_TREE.js';
import { TreeDataContext } from './TreeDataContext.js';

export function TreeViewContextProvider({ children }: PropsWithChildren): React.ReactNode {
  const data = use(TreeDataContext);
  useCaptureViewContext((context, id) => {
    context.set(DATA_CONTEXT_TREE_DATA, data, id);
  });

  return children;
}
