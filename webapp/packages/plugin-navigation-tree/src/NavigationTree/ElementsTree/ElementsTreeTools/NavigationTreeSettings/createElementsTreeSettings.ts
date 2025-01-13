/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { IElementsTreeSettings } from '../../useElementsTree.js';

export function createElementsTreeSettings(defaults?: Partial<IElementsTreeSettings>): IElementsTreeSettings {
  return {
    filter: false,
    filterAll: false,
    saveFilter: true,
    saveExpanded: true,
    foldersTree: false,
    showFolderExplorerPath: true,
    configurable: true,
    projects: true,
    objectsDescription: true,
    ...defaults,
  };
}

export function validateElementsTreeSettings(data: any): boolean {
  return (
    typeof data === 'object' &&
    typeof data.filterAll === 'boolean' &&
    typeof data.filter === 'boolean' &&
    typeof data.saveFilter === 'boolean' &&
    typeof data.saveExpanded === 'boolean' &&
    typeof data.foldersTree === 'boolean' &&
    typeof data.showFolderExplorerPath === 'boolean' &&
    typeof data.configurable === 'boolean' &&
    typeof data.projects === 'boolean' &&
    typeof data.objectsDescription === 'boolean'
  );
}
