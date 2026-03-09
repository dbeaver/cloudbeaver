/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { IPlanFeatures } from './IPlanFeatures.js';
import type { IPlanNode } from './IPlanNode.js';

export interface IPlanData {
  queryString: string;
  /** Can be a flat list (using parentId) or a tree (using children) */
  nodes: IPlanNode[];
  features: IPlanFeatures;
}
