/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { use } from 'react';
import { observer } from 'mobx-react-lite';

import { Node, TreeDataContext, type NodeComponent } from '@cloudbeaver/plugin-navigation-tree';

import { AiScopeNodeControl } from './AiScopeNodeControl.js';

export const AiScopeNode: NodeComponent = observer(function AiScopeNode(props) {
  const data = use(TreeDataContext)!;
  return (
    <div role="group" aria-label={data.getNode(props.nodeId).name}>
      <Node {...props} controlRenderer={AiScopeNodeControl} />
    </div>
  );
});
