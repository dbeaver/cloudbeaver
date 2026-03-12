/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useEffect, useRef, useState } from 'react';

import { computePlanLayout } from '../layout/computePlanLayout.js';
import type { ILayoutResult } from '../layout/ILayoutResult.js';
import type { IPlanDiagramOptions } from '../types/IPlanDiagramOptions.js';
import type { IPlanNode } from '../types/IPlanNode.js';

export interface IPlanLayout {
    layout: ILayoutResult | null;
    measureRef: React.RefObject<HTMLDivElement | null>;
}

export function usePlanLayout(
    visibleNodes: IPlanNode[],
    direction: IPlanDiagramOptions['direction'],
    onLayoutComputed?: (width: number, height: number) => void,
): IPlanLayout {
    const [layout, setLayout] = useState<ILayoutResult | null>(null);
    const measureRef = useRef<HTMLDivElement>(null);
    const onLayoutComputedRef = useRef(onLayoutComputed);

    useEffect(() => {
        onLayoutComputedRef.current = onLayoutComputed;
    });

    useEffect(() => {
        const measureContainer = measureRef.current;

        if (!measureContainer) {
            return;
        }

        const frame = requestAnimationFrame(() => {
            const nodeSizes = new Map<string, { width: number; height: number }>();

            for (const element of measureContainer.children) {
                const nodeId = (element as HTMLElement).dataset['nodeId'];

                if (nodeId) {
                    const rect = element.getBoundingClientRect();
                    nodeSizes.set(nodeId, { width: rect.width, height: rect.height });
                }
            }

            const result = computePlanLayout(visibleNodes, nodeSizes, { direction });
            setLayout(result);
            onLayoutComputedRef.current?.(result.width, result.height);
        });

        return () => cancelAnimationFrame(frame);
    }, [direction, visibleNodes]);

    return { layout, measureRef };
}
