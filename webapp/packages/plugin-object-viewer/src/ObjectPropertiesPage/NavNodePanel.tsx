/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { useNode } from '@cloudbeaver/plugin-navigation-tree';

import { ObjectPropertyTable } from './ObjectPropertyTable/ObjectPropertyTable.js';

interface Props {
  nodeId: string;
  parents: string[];
}

export const NavNodePanel = observer<Props>(function NavNodePanel({ nodeId }) {
  const nodeInfo = useNode(nodeId);

  if (!nodeInfo.node) {
    return null;
  }

  return <ObjectPropertyTable objectId={nodeId} parentId={nodeInfo.node.parentId} />;
});
