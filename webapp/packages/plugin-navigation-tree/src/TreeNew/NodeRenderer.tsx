/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useContext } from 'react';

import { TreeContext } from './contexts/TreeContext';
import type { NodeComponent } from './INodeRenderer';
import { Node } from './Node';

export const NodeRenderer: NodeComponent = observer(function NodeRenderer(props) {
  const tree = useContext(TreeContext)!;
  const NodeComponent = tree.getNodeComponent(props.nodeId) ?? Node;

  return <NodeComponent {...props} />;
});
