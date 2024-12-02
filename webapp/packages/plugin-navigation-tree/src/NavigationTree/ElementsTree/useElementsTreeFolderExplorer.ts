/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { useEffect } from 'react';

import { getComputed, useFolderExplorer } from '@cloudbeaver/core-blocks';

import type { IElementsTreeSettings } from './useElementsTree.js';

export function useElementsTreeFolderExplorer(baseRoot: string, settings: IElementsTreeSettings | undefined) {
  const folderExplorer = useFolderExplorer(baseRoot, {
    saveState: settings?.saveExpanded,
  });

  const foldersTreeDisabled = getComputed(() => !settings?.foldersTree && folderExplorer.state.folder !== baseRoot);

  useEffect(() => {
    if (foldersTreeDisabled) {
      folderExplorer.open([], baseRoot);
    }
  });

  return folderExplorer;
}
