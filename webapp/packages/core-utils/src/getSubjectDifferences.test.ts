/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { describe, expect, it } from 'vitest';

import { getSubjectDifferences } from './getSubjectDifferences.js';

describe('getSubjectDifferences', () => {
  it('should return the correct differences', () => {
    const current = ['1', '2', '3'];
    const next = ['1', '2', '4'];
    expect(getSubjectDifferences(current, next)).toEqual({ subjectsToRevoke: ['3'], subjectsToGrant: ['4'] });
    expect(getSubjectDifferences(next, current)).toEqual({ subjectsToRevoke: ['4'], subjectsToGrant: ['3'] });
  });

  it('should return the correct differences when there are no differences', () => {
    const current = ['1', '2', '3'];
    const next = ['1', '2', '3'];
    expect(getSubjectDifferences(current, next)).toEqual({ subjectsToRevoke: [], subjectsToGrant: [] });
    expect(getSubjectDifferences([], [])).toEqual({ subjectsToRevoke: [], subjectsToGrant: [] });
  });
});
