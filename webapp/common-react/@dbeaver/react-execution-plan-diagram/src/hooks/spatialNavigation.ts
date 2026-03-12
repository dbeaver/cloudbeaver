/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

export type Direction = 'left' | 'right' | 'up' | 'down';

export interface INodeCenter {
    x: number;
    y: number;
}

// We give more importance to movement in the chosen direction than to sideways movement.
// Weight 5 means that 1px forward is stronger than up to 4px sideways.
// This helps keyboard navigation move in the expected direction and not jump diagonally too often.
export const PRIMARY_AXIS_WEIGHT = 5;

export function getDirectionalNavigationScore(dx: number, dy: number, direction: Direction): number | null {
    let primaryDistance = 0;
    let secondaryDistance = 0;

    switch (direction) {
        case 'left':
            if (dx >= 0) {
                return null;
            }
            primaryDistance = Math.abs(dx);
            secondaryDistance = Math.abs(dy);
            break;
        case 'right':
            if (dx <= 0) {
                return null;
            }
            primaryDistance = dx;
            secondaryDistance = Math.abs(dy);
            break;
        case 'up':
            if (dy >= 0) {
                return null;
            }
            primaryDistance = Math.abs(dy);
            secondaryDistance = Math.abs(dx);
            break;
        case 'down':
            if (dy <= 0) {
                return null;
            }
            primaryDistance = dy;
            secondaryDistance = Math.abs(dx);
            break;
    }

    // Ignore candidates that are farther sideways than they are in the requested direction.
    // The weight below then ranks only the candidates that still feel directionally correct.
    if (primaryDistance < secondaryDistance) {
        return null;
    }

    return primaryDistance * PRIMARY_AXIS_WEIGHT + secondaryDistance;
}

export function findClosestNodeInDirection(
    currentNodeId: string,
    nodeCenters: Map<string, INodeCenter>,
    direction: Direction,
): string | null {
    const currentNode = nodeCenters.get(currentNodeId);

    if (!currentNode) {
        return null;
    }

    let bestNodeId: string | null = null;
    let bestScore = Number.POSITIVE_INFINITY;

    for (const [candidateId, center] of nodeCenters) {
        if (candidateId === currentNodeId) {
            continue;
        }

        const score = getDirectionalNavigationScore(center.x - currentNode.x, center.y - currentNode.y, direction);

        if (score != null && score < bestScore) {
            bestScore = score;
            bestNodeId = candidateId;
        }
    }

    return bestNodeId;
}