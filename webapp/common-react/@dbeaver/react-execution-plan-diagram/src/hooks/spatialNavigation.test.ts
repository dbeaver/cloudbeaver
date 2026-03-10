/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { describe, expect, it } from 'vitest';

import { findClosestNodeInDirection, getDirectionalNavigationScore, PRIMARY_AXIS_WEIGHT } from './spatialNavigation.js';

describe('getDirectionalNavigationScore', () => {
    it('returns null for candidates outside the requested direction', () => {
        // The node is on the right, so it should not be used for Left.
        expect(getDirectionalNavigationScore(10, 0, 'left')).toBeNull();
        // The node is on the left, so it should not be used for Right.
        expect(getDirectionalNavigationScore(-10, 0, 'right')).toBeNull();
        // The node is below, so it should not be used for Up.
        expect(getDirectionalNavigationScore(0, 10, 'up')).toBeNull();
        // The node is above, so it should not be used for Down.
        expect(getDirectionalNavigationScore(0, -10, 'down')).toBeNull();
    });

    it('rejects candidates that drift farther sideways than they advance in the requested direction', () => {
        // The node is a little to the right, but much more below, so it does not feel like Right.
        expect(getDirectionalNavigationScore(2, 9, 'right')).toBeNull();
        // The node is a little below, but much more to the left, so it does not feel like Down.
        expect(getDirectionalNavigationScore(-8, 1, 'down')).toBeNull();
        // The node is a little above, but much more to the right, so it does not feel like Up.
        expect(getDirectionalNavigationScore(7, -3, 'up')).toBeNull();
        // The node is a little to the left, but much more below, so it does not feel like Left.
        expect(getDirectionalNavigationScore(-3, 6, 'left')).toBeNull();
    });

    it('weights the primary axis more than sideways movement', () => {
        // This node is mostly on the right, so it gets a normal score for Right.
        expect(getDirectionalNavigationScore(5, 2, 'right')).toBe(5 * PRIMARY_AXIS_WEIGHT + 2);
        // This node is mostly on the left, so it gets a normal score for Left.
        expect(getDirectionalNavigationScore(-7, 3, 'left')).toBe(7 * PRIMARY_AXIS_WEIGHT + 3);
        // This node is mostly above, so it gets a normal score for Up.
        expect(getDirectionalNavigationScore(4, -6, 'up')).toBe(6 * PRIMARY_AXIS_WEIGHT + 4);
        // This node is mostly below, so it gets a normal score for Down.
        expect(getDirectionalNavigationScore(-8, 9, 'down')).toBe(9 * PRIMARY_AXIS_WEIGHT + 8);
    });
});

describe('findClosestNodeInDirection', () => {
    const nodeCenters = new Map([
        ['current', { x: 0, y: 0 }],
        ['right-near', { x: 10, y: 1 }],
        ['right-far', { x: 14, y: 0 }],
        ['right-off-axis', { x: 2, y: 9 }],
        ['down-near', { x: 0, y: 9 }],
        ['down-far', { x: 0, y: 15 }],
        ['left', { x: -8, y: 1 }],
    ]);

    it('picks the best candidate in the requested direction using the weighted score', () => {
        // right-near is the best right-side node because it is close and not far off-axis.
        expect(findClosestNodeInDirection('current', nodeCenters, 'right')).toBe('right-near');
        // down-near is the best down-side node because it is the closest valid node below.
        expect(findClosestNodeInDirection('current', nodeCenters, 'down')).toBe('down-near');
        // left is the only valid node on the left.
        expect(findClosestNodeInDirection('current', nodeCenters, 'left')).toBe('left');
    });

    it('returns null when there is no candidate in the requested direction', () => {
        // There is no node above the current node.
        expect(findClosestNodeInDirection('current', nodeCenters, 'up')).toBeNull();
        // We cannot search from a node that does not exist.
        expect(findClosestNodeInDirection('missing', nodeCenters, 'right')).toBeNull();
    });
});