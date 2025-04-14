/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { getComputed, Loader, Translate, TreeNodeNestedMessage } from '@cloudbeaver/core-blocks';
import type { ILoadableState } from '@cloudbeaver/core-utils';

import type { IElementsTreeContext } from './ElementsTreeContext.js';

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
  const loading = getComputed(() => childrenState.isLoading() || context.tree.isLoading() || context.tree.isOutdated?.());

  if (!hasChildren) {
    if (loading) {
      return <Loader />;
    } else if (context.tree.filtering) {
      return (
        <TreeNodeNestedMessage>
          <Translate token="app_navigationTree_node_no_results" filter={context.tree.filter} />
        </TreeNodeNestedMessage>
      );
    } else if (context.folderExplorer.root === context.folderExplorer.state.folder) {
      return <>{Placeholder && <Placeholder />}</>;
    }
  }

  return <Loader suspense>{children}</Loader>;
});
