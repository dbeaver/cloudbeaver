/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import React, { use } from 'react';
import { observer } from 'mobx-react-lite';
import { DATA_CONTEXT_TREE_DATA, DATA_CONTEXT_TREE_FILTER, DATA_CONTEXT_TREE_REFRESH, type ITreeToolbarFilter } from './DATA_CONTEXT_TREE.js';

import { clsx } from '@dbeaver/ui-kit';
import { useCaptureViewContext } from '@cloudbeaver/core-view';
import { TreeDataContext } from './contexts/TreeDataContext.js';

export interface TreeToolbarProps {
  filter?: ITreeToolbarFilter;
  onRefresh?: () => Promise<void> | void;
  className?: string;
}

export const TreeToolbar = observer<React.PropsWithChildren<TreeToolbarProps>>(function TreeToolbar({ className, children, filter, onRefresh }) {
  const data = use(TreeDataContext);
  useCaptureViewContext((context, id) => {
    context.set(DATA_CONTEXT_TREE_DATA, data, id);
    context.set(DATA_CONTEXT_TREE_FILTER, filter, id);
    context.set(DATA_CONTEXT_TREE_REFRESH, onRefresh, id);
  });
  return <div className={clsx('tw:sticky tw:top-0 tw:z-1 tw:px-2 theme-background-surface', className)}>{children}</div>;
});
