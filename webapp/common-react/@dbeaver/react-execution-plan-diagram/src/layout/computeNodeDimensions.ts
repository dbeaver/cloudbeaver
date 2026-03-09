/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { IPlanNode } from '../types/IPlanNode.js';

const MIN_WIDTH = 120;
const MAX_WIDTH = 400;
const CHAR_WIDTH = 7;
const PADDING_X = 24;

export function computeNodeWidth(node: IPlanNode): number {
  const typeWidth = node.type.length * CHAR_WIDTH + PADDING_X;
  const nameWidth = node.name ? node.name.length * CHAR_WIDTH + PADDING_X : 0;

  return Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, Math.max(typeWidth, nameWidth)));
}
