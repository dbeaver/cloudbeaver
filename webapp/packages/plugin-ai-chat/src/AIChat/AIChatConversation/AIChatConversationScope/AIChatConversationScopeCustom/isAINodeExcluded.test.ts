/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { describe, expect, test } from 'vitest';

import { isAINodeExcluded } from './isAINodeExcluded.js';

describe('isAINodeExcluded', () => {
  const excludedNodeIds = ['database://connection/catalog/schema/table'];

  test('excludes the configured node', () => {
    expect(isAINodeExcluded('database://connection/catalog/schema/table', excludedNodeIds)).toBe(true);
  });

  test('excludes descendants of the configured node', () => {
    expect(isAINodeExcluded('database://connection/catalog/schema/table/column', excludedNodeIds)).toBe(true);
  });

  test('does not exclude nodes with a matching prefix', () => {
    expect(isAINodeExcluded('database://connection/catalog/schema/table_copy', excludedNodeIds)).toBe(false);
  });

  test('does not exclude ancestors of the configured node', () => {
    expect(isAINodeExcluded('database://connection/catalog/schema', excludedNodeIds)).toBe(false);
  });
});
