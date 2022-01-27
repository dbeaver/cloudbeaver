/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { action, observable } from 'mobx';
import { useContext } from 'react';

import { useObservableRef } from '../useObservableRef';
import { FolderExplorerContext, IFolderExplorerContext, IFolderExplorerOptions } from './FolderExplorerContext';

export function useFolderExplorer(root: string, options: IFolderExplorerOptions = {}): IFolderExplorerContext {
  const context = useContext(FolderExplorerContext);

  const state = useObservableRef<IFolderExplorerContext>(() => ({
    root,
    path: [],
    fullPath: [root],
    folder: root,
    options,
    open(path: string[], folder: string) {
      this.path = path.slice();
      this.fullPath = [...path, folder];
      this.folder = folder;
    },
  }), {
    root: observable,
    path: observable,
    fullPath: observable,
    folder: observable,
    options: observable.ref,
    open: action.bound,
  }, false);

  return context || state;
}
