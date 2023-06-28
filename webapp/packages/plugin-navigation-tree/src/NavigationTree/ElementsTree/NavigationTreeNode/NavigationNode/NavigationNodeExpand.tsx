/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useContext, useDeferredValue } from 'react';
import styled from 'reshadow';

import { getComputed, TREE_NODE_STYLES, TreeNodeExpand } from '@cloudbeaver/core-blocks';

import { ElementsTreeContext } from '../../ElementsTreeContext';

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

  return styled(TREE_NODE_STYLES)(<TreeNodeExpand filterActive={filterActive} />);
});
