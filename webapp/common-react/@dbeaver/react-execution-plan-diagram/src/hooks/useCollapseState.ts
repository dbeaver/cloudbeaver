/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useCallback, useState } from 'react';

export interface ICollapseState {
    rawCollapsedNodes: Set<string>;
    handleToggleCollapse(nodeId: string): void;
}

export function useCollapseState(enabled: boolean): ICollapseState {
    const [rawCollapsedNodes, setRawCollapsedNodes] = useState<Set<string>>(new Set());

    const handleToggleCollapse = useCallback(
        (nodeId: string) => {
            if (!enabled) {
                return;
            }

            setRawCollapsedNodes(previous => {
                const next = new Set(previous);

                if (next.has(nodeId)) {
                    next.delete(nodeId);
                } else {
                    next.add(nodeId);
                }

                return next;
            });
        },
        [enabled],
    );

    return { rawCollapsedNodes, handleToggleCollapse };
}
