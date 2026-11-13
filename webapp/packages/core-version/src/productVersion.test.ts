/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { describe, expect, test } from 'vitest';

import { compareProductVersions, parseProductVersion } from './productVersion.js';

describe('parseProductVersion', () => {
  test.each([
    { version: '26.2.0', release: '26.2.0', hotfixVersion: 0 },
    { version: '26.2.0.0', release: '26.2.0', hotfixVersion: 0 },
    { version: '26.2.0.10', release: '26.2.0.10', hotfixVersion: 10 },
    { version: ' v26.2.0.1 ', release: '26.2.0.1', hotfixVersion: 1 },
  ])('parses the release and hotfix number from "$version"', ({ version, release, hotfixVersion }) => {
    expect(parseProductVersion(version)).toMatchObject({
      release,
      hotfixVersion,
      base: { major: 26, minor: 2, patch: 0 },
    });
  });

  test('keeps prerelease and build information separate from the display release', () => {
    expect(parseProductVersion('26.2.0.1-beta.2+build.7')).toMatchObject({
      release: '26.2.0.1',
      hotfixVersion: 1,
      base: { prerelease: ['beta', 2], build: ['build', '7'] },
    });
  });

  test.each(['26.2.0.202610091857', '26.2.0.20261009185730'])('does not mistake the OSGi timestamp in %s for a hotfix', version => {
    expect(parseProductVersion(version)).toMatchObject({ release: '26.2.0', hotfixVersion: 0 });
  });

  test.each(['', 'invalid', '26.2', '26.2.0.1.2', '26.2.0.-1', '26.2.0.01', '26.02.0', '26.2.0.9007199254740992', '26.2.0-'])(
    'rejects invalid version "%s"',
    version => {
      expect(parseProductVersion(version)).toBeNull();
    },
  );
});

describe('compareProductVersions', () => {
  test.each([
    ['26.2.0.1', '26.2.0'],
    ['26.2.0.10', '26.2.0.2'],
    ['26.2.1', '26.2.0.10'],
    ['26.3.0', '26.2.9.10'],
    ['27.0.0', '26.9.9.10'],
    ['26.2.0', '26.2.0-beta.2'],
    ['26.2.0.1', '26.2.0.1-beta.2'],
    ['26.2.0.1-beta.10', '26.2.0.1-beta.2'],
  ])('orders %s after %s in both comparison directions', (newer, older) => {
    expect(compareProductVersions(newer, older)).toBe(1);
    expect(compareProductVersions(older, newer)).toBe(-1);
  });

  test.each([
    ['26.2.0.1', '26.2.0.1'],
    ['26.2.0', '26.2.0.0'],
    ['26.2.0.1+build.1', '26.2.0.1+build.2'],
    ['26.2.0.202610091857', '26.2.0'],
    ['26.2.0.20261009185730', '26.2.0'],
  ])('treats %s and %s as the same release', (first, second) => {
    expect(compareProductVersions(first, second)).toBe(0);
    expect(compareProductVersions(second, first)).toBe(0);
  });

  test.each(['', 'invalid', '26.2.0.9007199254740992'])('returns NaN for invalid input "%s" on either side', version => {
    expect(compareProductVersions(version, '26.2.0')).toBeNaN();
    expect(compareProductVersions('26.2.0', version)).toBeNaN();
    expect(compareProductVersions(version, version)).toBeNaN();
  });
});
