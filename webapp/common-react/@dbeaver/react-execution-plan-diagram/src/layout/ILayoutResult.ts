/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { ILayoutEdge } from './ILayoutEdge.js';
import type { ILayoutNode } from './ILayoutNode.js';

export interface ILayoutResult {
  nodes: ILayoutNode[];
  edges: ILayoutEdge[];
  width: number;
  height: number;
}
