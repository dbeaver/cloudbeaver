/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { action, observable } from 'mobx';
import { useContext, useMemo } from 'react';

import { useObservableRef } from '../useObservableRef';
import { useUserData } from '../useUserData';
import { FolderExplorerContext, IFolderExplorerContext, IFolderExplorerOptions, IFolderExplorerState } from './FolderExplorerContext';

export function useFolderExplorer(root: string, options: IFolderExplorerOptions = {}): IFolderExplorerContext {
  const context = useContext(FolderExplorerContext);

  const userState = useUserData<IFolderExplorerState>(
    `folders-explorer-${root}`,
    () => ({
      path: [],
      fullPath: [root],
      folder: root,
    }),
    () => { },
    data => (
      typeof data === 'object'
      && typeof data.folder === 'string'
      && Array.isArray(data.path)
      && Array.isArray(data.fullPath)
    )
  );

  useMemo(action(() => {
    if (!options.saveState) {
      userState.folder = root;
      userState.fullPath = [root];
      userState.path = [];
    }
  }), [userState]);

  const data = useObservableRef<IFolderExplorerContext>(() => ({
    root,
    options,
    open(path: string[], folder: string) {
      this.state.path = path.slice();
      this.state.fullPath = [...path, folder];
      this.state.folder = folder;
    },
  }), {
    root: observable,
    state: observable.ref,
    options: observable.ref,
    open: action.bound,
  }, {
    state: userState,
  });

  return context || data;
}
