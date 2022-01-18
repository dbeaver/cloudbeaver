/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';

import { FolderExplorerContext, IFolderExplorerContext } from './FolderExplorerContext';

interface Props{
  state: IFolderExplorerContext;
}

export const FolderExplorer = observer<Props>(function FolderExplorer({
  state,
  children,
}) {
  return (
    <FolderExplorerContext.Provider value={state}>{children}</FolderExplorerContext.Provider>
  );
});
