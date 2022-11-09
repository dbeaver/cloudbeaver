/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled, { css } from 'reshadow';

import { Loader, Translate, TreeNodeNestedMessage, TREE_NODE_STYLES } from '@cloudbeaver/core-blocks';
import type { ILoadableState } from '@cloudbeaver/core-utils';

import type { IElementsTreeContext } from './ElementsTreeContext';

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
  context: IElementsTreeContext;
  childrenState: ILoadableState;
  emptyPlaceholder?: React.FC;
  hasChildren?: boolean;
}

export const ElementsTreeLoader = observer<React.PropsWithChildren<Props>>(function ElementsTreeLoader({
  root,
  context,
  childrenState,
  emptyPlaceholder: Placeholder,
  hasChildren,
  children,
}) {
  let loading = childrenState.isLoading() || context.tree.loading;

  if (context.tree.settings?.foldersTree && context.folderExplorer.root !== root) {
    loading = false;
  }

  if (context.tree.settings?.saveExpanded && context.tree.loading) {
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
    } else if (context.tree.filtering) {
      return styled(TREE_NODE_STYLES)(
        <TreeNodeNestedMessage>
          <Translate token='app_navigationTree_node_no_results' filter={context.tree.filter} />
        </TreeNodeNestedMessage>
      );
    } else if (context.folderExplorer.root === context.folderExplorer.state.folder) {
      return <>{Placeholder && <Placeholder />}</>;
    }
  }

  return (
    <>
      {children}
    </>
  );
});
