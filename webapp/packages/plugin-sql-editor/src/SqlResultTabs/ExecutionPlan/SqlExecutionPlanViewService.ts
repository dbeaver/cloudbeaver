/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';
import { TabsContainer } from '@cloudbeaver/core-ui';

import type { ISqlExecutionPlanViewProps } from './ISqlExecutionPlanViewProps.js';

@injectable()
export class SqlExecutionPlanViewService {
  readonly tabs: TabsContainer<ISqlExecutionPlanViewProps>;

  constructor() {
    this.tabs = new TabsContainer('Execution Plan Views');
  }
}
