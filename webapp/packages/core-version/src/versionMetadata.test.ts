/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { describe, expect, test } from 'vitest';

import { getVersionReleaseNotes, normalizeVersions } from './versionMetadata.js';

const release = {
  number: '26.2.0',
  date: '2026-11-01',
  releaseNotes: 'Base release',
};

const patches = [
  { patchNumber: 2, releaseNotes: 'Second hotfix' },
  { patchNumber: 10, releaseNotes: 'Tenth hotfix' },
  { patchNumber: 1, releaseNotes: 'First hotfix' },
];

describe('normalizeVersions', () => {
  test('expands patches into releases without changing the feed', () => {
    const feed = [{ ...release, patches }];
    const versions = normalizeVersions(feed);

    expect(versions.map(version => version.number)).toEqual(['26.2.0', '26.2.0.2', '26.2.0.10', '26.2.0.1']);
    expect(versions[2]).toEqual({ number: '26.2.0.10', date: '', releaseNotes: 'Tenth hotfix' });
    expect(feed[0]?.patches).toEqual(patches);
    expect(feed[0]?.number).toBe('26.2.0');
  });

  test('keeps legacy feeds and empty patch lists compatible', () => {
    expect(normalizeVersions([release])).toEqual([release]);
    expect(normalizeVersions([{ ...release, patches: [] }])).toEqual([{ ...release, patches: [] }]);
  });

  test('ignores invalid versions and patch numbers', () => {
    const versions = normalizeVersions([
      { ...release, number: 'invalid' },
      {
        ...release,
        patches: [
          ...patches,
          ...[0, -1, 1.5, Number.MAX_SAFE_INTEGER + 1, 202611131559].map(patchNumber => ({ patchNumber, releaseNotes: 'Invalid' })),
        ],
      },
    ]);

    expect(versions.map(version => version.number)).toEqual(['26.2.0', '26.2.0.2', '26.2.0.10', '26.2.0.1']);
  });
});

describe('getVersionReleaseNotes', () => {
  const versions = normalizeVersions([
    { ...release, patches },
    { ...release, number: '26.1.0' },
  ]);

  test('includes all preceding hotfix notes and the base release, newest first', () => {
    expect(getVersionReleaseNotes(versions, '26.2.0.10').map(version => version.releaseNotes)).toEqual([
      'Tenth hotfix',
      'Second hotfix',
      'First hotfix',
      'Base release',
    ]);
  });

  test('excludes later hotfixes and other releases when an older hotfix is selected', () => {
    expect(getVersionReleaseNotes(versions, '26.2.0.1').map(version => version.number)).toEqual(['26.2.0.1', '26.2.0']);
    expect(getVersionReleaseNotes(versions, '26.2.0').map(version => version.number)).toEqual(['26.2.0']);
  });
});
