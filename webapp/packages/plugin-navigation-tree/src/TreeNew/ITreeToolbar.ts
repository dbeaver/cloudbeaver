/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { ITreeData } from './ITreeData.js';
import type { ITreeFilter } from './useTreeFilter.js';
import type { ITreeSelection } from './useTreeSelection.js';

export interface ITreeToolbarSettings {
  filter: boolean;
}

export interface ITreeToolbar {
  treeData: ITreeData;
  settings?: ITreeToolbarSettings;
  treeFilter?: ITreeFilter & { filterPlaceholder?: string };
  selection?: ITreeSelection;
  disabled?: boolean;
  onRefresh?: () => Promise<void>;
  className?: string;
}
