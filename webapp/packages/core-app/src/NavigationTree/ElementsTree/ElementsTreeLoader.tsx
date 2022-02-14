/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled, { css } from 'reshadow';

import { ILoadableState, Loader } from '@cloudbeaver/core-blocks';

import type { ITreeContext } from './TreeContext';

const styles = css`
  center {
    display: flex;
    height: 100%;
    width: 100%;
    min-width: 240px;
  }
`;

interface Props {
  root: string;
  context: ITreeContext;
  childrenState: ILoadableState;
  emptyPlaceholder?: React.FC;
  keepData?: boolean;
  hasChildren?: boolean;
}

export const ElementsTreeLoader = observer<Props>(function ElementsTreeLoader({
  root,
  context,
  childrenState,
  emptyPlaceholder: Placeholder,
  keepData,
  hasChildren,
  children,
}) {
  let loading = childrenState.isLoading() || context.tree.loading;

  if (context.tree.foldersTree && context.folderExplorer.root !== root) {
    loading = false;
  }

  if (keepData && context.tree.loading) {
    return styled(styles)(
      <center>
        <Loader />
      </center>
    );
  }

  if (!hasChildren) {
    if (loading) {
      return styled(styles)(
        <center>
          <Loader />
        </center>
      );
    } else if (context.folderExplorer.root === context.folderExplorer.folder) {
      return <>{Placeholder && <Placeholder />}</>;
    }
  }

  return (
    <>
      {children}
    </>
  );
});
