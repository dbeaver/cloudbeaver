/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

export interface ILayoutEdge {
  sourceId: string;
  targetId: string;
  /** Source node bottom-center */
  x1: number;
  y1: number;
  /** Target node top-center */
  x2: number;
  y2: number;
}
