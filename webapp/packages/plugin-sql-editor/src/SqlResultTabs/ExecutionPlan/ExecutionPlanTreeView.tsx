/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';

import type { ISqlExecutionPlanViewProps } from './ISqlExecutionPlanViewProps.js';
import { ExecutionPlanTreeBlock } from './ExecutionPlanTreeBlock.js';

export const ExecutionPlanTreeView = observer<ISqlExecutionPlanViewProps>(function ExecutionPlanTreeView({
  nodes,
  query,
  onNodeSelect,
}) {
  return <ExecutionPlanTreeBlock nodeList={nodes} query={query} onNodeSelect={onNodeSelect} />;
});
