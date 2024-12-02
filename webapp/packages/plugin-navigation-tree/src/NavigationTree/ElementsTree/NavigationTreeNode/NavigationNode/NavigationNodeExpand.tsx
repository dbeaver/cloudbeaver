/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useContext, useDeferredValue } from 'react';

import { getComputed, TreeNodeExpand } from '@cloudbeaver/core-blocks';

import { ElementsTreeContext } from '../../ElementsTreeContext.js';

interface Props {
  nodeId: string;
}

export const NavigationNodeExpand = observer<Props>(function NavigationNodeExpand({ nodeId }) {
  const treeContext = useContext(ElementsTreeContext);

  const expandable = useDeferredValue(getComputed(() => treeContext?.tree.isNodeExpandable(nodeId) ?? true));
  const filterActive = useDeferredValue(getComputed(() => treeContext?.tree.filtering ?? false));

  if (!expandable) {
    return null;
  }

  return <TreeNodeExpand filterActive={filterActive} />;
});
