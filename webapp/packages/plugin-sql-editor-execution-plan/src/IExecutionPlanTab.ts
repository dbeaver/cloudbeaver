/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

export interface IExecutionPlanTab {
  tabId: string;
  order: number;
  query: string;
  options?: Record<string, any>;
}
