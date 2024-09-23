/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { action, observable } from 'mobx';
import { useContext, useEffect } from 'react';

import { useObservableRef } from '../useObservableRef.js';
import { useUserData } from '../useUserData.js';
import {
  FolderExplorerContext,
  type IFolderExplorerContext,
  type IFolderExplorerOptions,
  type IFolderExplorerState,
} from './FolderExplorerContext.js';

export function useFolderExplorer(root: string, options: IFolderExplorerOptions = {}): IFolderExplorerContext {
  const context = useContext(FolderExplorerContext);

  const userState = useUserData<IFolderExplorerState>(
    `folders-explorer-${root}`,
    () => ({
      path: [],
      fullPath: [root],
      folder: root,
    }),
    () => {},
    data => typeof data === 'object' && typeof data.folder === 'string' && Array.isArray(data.path) && Array.isArray(data.fullPath),
  );

  const saveState = options.saveState;

  useEffect(
    action(() => {
      if (!saveState) {
        userState.folder = root;
        userState.fullPath = [root];
        userState.path = [];
      }
    }),
    [userState, saveState],
  );

  const data = useObservableRef<IFolderExplorerContext>(
    () => ({
      root,
      options,
      open(path: string[], folder: string) {
        this.state.path = path.slice();
        this.state.fullPath = [...path, folder];
        this.state.folder = folder;
      },
    }),
    {
      root: observable,
      state: observable.ref,
      options: observable.ref,
      open: action.bound,
    },
    {
      state: userState,
      root,
    },
  );

  return context || data;
}
