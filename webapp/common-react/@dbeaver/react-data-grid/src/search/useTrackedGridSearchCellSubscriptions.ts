/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useCallback, useEffect, useRef } from 'react';

import type { IGridReactiveValue } from '../IGridReactiveValue.js';

export interface IUseTrackedGridSearchCellSubscriptionsOptions {
    debounceMs: number;
    onTrackedCellChange: () => void;
}

export interface IUseTrackedGridSearchCellSubscriptionsResult {
    syncGridSubscriptions: (cellText: IGridReactiveValue<string, [number, number]> | undefined, rowCount: number, columnCount: number) => void;
    clearTrackedCellSubscriptions: () => void;
}

export function useTrackedGridSearchCellSubscriptions({
    debounceMs,
    onTrackedCellChange,
}: IUseTrackedGridSearchCellSubscriptionsOptions): IUseTrackedGridSearchCellSubscriptionsResult {
    const trackedCellUnsubscribesRef = useRef<Array<() => void>>([]);
    const searchRerunTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const subscriptionSourceRef = useRef<IGridReactiveValue<string, [number, number]> | undefined>(undefined);
    const subscriptionSizeRef = useRef({ rowCount: -1, columnCount: -1 });

    const clearTrackedCellSubscriptions = useCallback((): void => {
        if (searchRerunTimeoutRef.current !== null) {
            clearTimeout(searchRerunTimeoutRef.current);
            searchRerunTimeoutRef.current = null;
        }

        for (const unsubscribe of trackedCellUnsubscribesRef.current) {
            unsubscribe();
        }

        trackedCellUnsubscribesRef.current = [];
        subscriptionSourceRef.current = undefined;
        subscriptionSizeRef.current = { rowCount: -1, columnCount: -1 };
    }, []);

    const scheduleTrackedCellSearchRerun = useCallback((): void => {
        if (searchRerunTimeoutRef.current !== null) {
            clearTimeout(searchRerunTimeoutRef.current);
        }

        searchRerunTimeoutRef.current = setTimeout(() => {
            searchRerunTimeoutRef.current = null;
            onTrackedCellChange();
        }, debounceMs);
    }, [debounceMs, onTrackedCellChange]);

    const syncGridSubscriptions = useCallback(
        (cellText: IGridReactiveValue<string, [number, number]> | undefined, rowCount: number, columnCount: number): void => {
            const sourceChanged = subscriptionSourceRef.current !== cellText;
            const sizeChanged = subscriptionSizeRef.current.rowCount !== rowCount || subscriptionSizeRef.current.columnCount !== columnCount;

            if (!sourceChanged && !sizeChanged) {
                return;
            }

            clearTrackedCellSubscriptions();
            subscriptionSourceRef.current = cellText;
            subscriptionSizeRef.current = { rowCount, columnCount };

            if (!cellText) {
                return;
            }

            // Current implementation performs full-grid search (rows * cols),
            // so we subscribe to all cells in the current grid.
            // If partial/range search is introduced later, this should be revised.
            const unsubscribes: Array<() => void> = [];
            for (let rowIdx = 0; rowIdx < rowCount; rowIdx++) {
                for (let colIdx = 0; colIdx < columnCount; colIdx++) {
                    unsubscribes.push(cellText.subscribe(scheduleTrackedCellSearchRerun, rowIdx, colIdx));
                }
            }

            trackedCellUnsubscribesRef.current = unsubscribes;
        },
        [clearTrackedCellSubscriptions, scheduleTrackedCellSearchRerun],
    );

    useEffect(
        () => () => {
            clearTrackedCellSubscriptions();
        },
        [clearTrackedCellSubscriptions],
    );

    return {
        syncGridSubscriptions,
        clearTrackedCellSubscriptions,
    };
}
