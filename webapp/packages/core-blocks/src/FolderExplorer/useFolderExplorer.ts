/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { action, observable } from 'mobx';
import { useContext } from 'react';

import { useObservableRef } from '../useObservableRef';
import { FolderExplorerContext, IFolderExplorerContext } from './FolderExplorerContext';

export function useFolderExplorer(root: string): IFolderExplorerContext {
  const context = useContext(FolderExplorerContext);

  const state = useObservableRef<IFolderExplorerContext>(() => ({
    root,
    path: [],
    folder: root,
    open(folder: string) {
      if (folder === root) {
        this.path = [];
        this.folder = folder;
      } else {
        const index = this.path.indexOf(folder);

        if (index >= 0) {
          this.path.splice(index + 1, this.path.length);
          this.folder = folder;
        } else {
          this.path.push(folder);
          this.folder = folder;
        }
      }
    },
  }), {
    root: observable,
    path: observable,
    folder: observable,
    open: action.bound,
  }, false);

  return context || state;
}
