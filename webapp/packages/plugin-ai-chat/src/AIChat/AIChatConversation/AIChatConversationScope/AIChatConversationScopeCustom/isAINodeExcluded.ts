/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

export function isAINodeExcluded(nodeId: string, excludedNodeIds: readonly string[]): boolean {
  return excludedNodeIds.some(excludedNodeId => nodeId === excludedNodeId || nodeId.startsWith(`${excludedNodeId}/`));
}
