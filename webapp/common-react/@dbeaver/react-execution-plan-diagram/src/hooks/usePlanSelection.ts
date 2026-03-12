/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useCallback, useMemo, useState } from 'react';

import type { IPlanNode } from '../types/IPlanNode.js';

export interface IPlanSelection {
    selectedNodeId: string | null;
    handleNodeSelect(nodeId: string | null): void;
}

export function usePlanSelection(
    nodeMap: Map<string, IPlanNode>,
    externalSelectedNodeId: string | null | undefined,
    onNodeSelect?: ((nodeId: string | null, node: IPlanNode | null) => void) | undefined,
): IPlanSelection {
    const [internalSelectedNodeId, setInternalSelectedNodeId] = useState<string | null>(null);
    const isControlled = externalSelectedNodeId !== undefined;

    const selectedNodeId = useMemo(() => {
        const id = isControlled ? externalSelectedNodeId ?? null : internalSelectedNodeId;

        if (id == null || !nodeMap.has(id)) {
            return null;
        }

        return id;
    }, [externalSelectedNodeId, internalSelectedNodeId, isControlled, nodeMap]);

    const handleNodeSelect = useCallback(
        (nodeId: string | null) => {
            if (nodeId == null) {
                if (!isControlled) {
                    setInternalSelectedNodeId(null);
                }

                onNodeSelect?.(null, null);
                return;
            }

            if (!isControlled) {
                setInternalSelectedNodeId(nodeId);
            }

            onNodeSelect?.(nodeId, nodeMap.get(nodeId) ?? null);
        },
        [isControlled, nodeMap, onNodeSelect],
    );

    return { selectedNodeId, handleNodeSelect };
}
