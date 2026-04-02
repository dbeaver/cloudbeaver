/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { SqlExecutionPlanNode } from '@cloudbeaver/core-sdk';

export interface ISqlExecutionPlanViewProps {
  nodes: SqlExecutionPlanNode[];
  query: string;
  selectedNode: string | null;
  onNodeSelect: (nodeId: string | null) => void;
}
