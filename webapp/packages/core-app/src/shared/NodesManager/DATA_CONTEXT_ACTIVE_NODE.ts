/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { createDataContext } from '@cloudbeaver/core-view';

export interface IDataContextActiveNode {
  nodeId: string;
  path: string[];
}

export const DATA_CONTEXT_ACTIVE_NODE = createDataContext<IDataContextActiveNode>('nav-node-active');
