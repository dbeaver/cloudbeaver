/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled from 'reshadow';

import { getComputed, Loader, Translate, TreeNodeNestedMessage, TREE_NODE_STYLES } from '@cloudbeaver/core-blocks';
import type { ILoadableState } from '@cloudbeaver/core-utils';

import type { IElementsTreeContext } from './ElementsTreeContext';

interface Props {
  context: IElementsTreeContext;
  childrenState: ILoadableState;
  emptyPlaceholder?: React.FC;
}

export const ElementsTreeContentLoader = observer<React.PropsWithChildren<Props>>(function ElementsTreeContentLoader({
  context,
  childrenState,
  emptyPlaceholder: Placeholder,
  children,
}) {
  const hasChildren = getComputed(() => context.tree.getNodeChildren(context.tree.root).length > 0);

  const loading = getComputed(() => (
    childrenState.isLoading()
    || context.tree.loading
  ) && !context.tree.isLoaded());

  if (!hasChildren) {
    if (loading) {
      return (
        <Loader />
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
    <Loader suspense>
      {children}
    </Loader>
  );
});
