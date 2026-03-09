/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useCallback, useState } from 'react';

export interface INodeSelectionState {
  selectedNodeId: string | null;
  selectNode(nodeId: string): void;
  clearSelection(): void;
}

export function useNodeSelection(): INodeSelectionState {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const selectNode = useCallback((nodeId: string) => {
    setSelectedNodeId(nodeId);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedNodeId(null);
  }, []);

  return { selectedNodeId, selectNode, clearSelection };
}
