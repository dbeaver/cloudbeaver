/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { EPlanNodeKind } from './PlanNodeKind.js';

export interface IPlanNodeProperty {
  id: string;
  category?: string;
  displayName: string;
  value: string | number | boolean | null;
  description?: string;
}

export interface IPlanNode {
  id: string;
  kind: EPlanNodeKind;
  name?: string;
  type: string;
  condition?: string;
  description?: string;
  parentId?: string;
  children?: IPlanNode[];
  cost?: number;
  /** Fraction of total cost, 0..1 */
  percent?: number;
  /** Duration in milliseconds */
  duration?: number;
  rowCount?: number;
  properties?: IPlanNodeProperty[];
}
