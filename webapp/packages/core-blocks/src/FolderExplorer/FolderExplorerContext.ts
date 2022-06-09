/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { createContext } from 'react';

export interface IFolderExplorerOptions {
  expandFoldersWithSingleElement?: boolean;
  saveState?: boolean;
}

export interface IFolderExplorerState {
  path: string[];
  fullPath: string[];
  folder: string;
}

export interface IFolderExplorerContext {
  root: string;
  state: IFolderExplorerState;
  options: IFolderExplorerOptions;

  open: (path: string[], folder: string) => void;
}

export const FolderExplorerContext = createContext<IFolderExplorerContext | null>(null);
