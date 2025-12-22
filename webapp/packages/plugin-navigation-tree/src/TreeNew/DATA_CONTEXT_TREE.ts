/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { createDataContext } from '@cloudbeaver/core-data-context';

import type { ITreeData } from './ITreeData.js';
import type { ITreeFilter } from './useTreeFilter.js';

export type ITreeToolbarFilter = ITreeFilter & { filterPlaceholder?: string };
export type TreeRefreshHandler = () => Promise<void>;

export const DATA_CONTEXT_TREE_DATA = createDataContext<ITreeData>('tree-new-data');
export const DATA_CONTEXT_TREE_FILTER = createDataContext<ITreeToolbarFilter>('tree-new-filter');
export const DATA_CONTEXT_TREE_REFRESH = createDataContext<TreeRefreshHandler>('tree-new-refresh');
