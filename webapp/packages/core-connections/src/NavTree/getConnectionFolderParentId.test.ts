/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { describe, expect, test } from 'vitest';

import { getConnectionFolderParentId } from './getConnectionFolderParentId.js';

describe('getConnectionFolderParentId', () => {
  test('should return the project for a root folder', () => {
    expect(getConnectionFolderParentId('project', 'node://project/datasources/folder')).toBe('node://project');
  });

  test('should return the containing folder for a nested folder', () => {
    expect(getConnectionFolderParentId('project', 'node://project/datasources/parent/folder')).toBe(
      'node://project/datasources/parent',
    );
  });

  test('should return the authoritative parent when provided', () => {
    expect(getConnectionFolderParentId('project', 'node://project/datasources/folder', 'node://project/custom-parent')).toBe(
      'node://project/custom-parent',
    );
  });

  test('should return the project for an invalid folder node id', () => {
    expect(getConnectionFolderParentId('project', 'node://another-project/datasources/folder')).toBe('node://project');
    expect(getConnectionFolderParentId('project', 'node://project/other/folder')).toBe('node://project');
  });
});
