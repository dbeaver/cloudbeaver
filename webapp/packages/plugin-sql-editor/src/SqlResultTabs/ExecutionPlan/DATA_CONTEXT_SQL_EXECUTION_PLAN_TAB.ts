/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { createDataContext } from '@cloudbeaver/core-data-context';

import type { IExecutionPlanTab } from '../../ISqlEditorTabState.js';

export const DATA_CONTEXT_SQL_EXECUTION_PLAN_TAB = createDataContext<IExecutionPlanTab>('sql-execution-plan-tab');
