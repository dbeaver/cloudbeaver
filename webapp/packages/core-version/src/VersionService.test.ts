/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { afterEach, describe, expect, it, vitest } from 'vitest';

import { VersionService } from './VersionService.js';

function createVersionService(backendVersion = ''): VersionService {
  return new VersionService({ data: { version: backendVersion } } as ConstructorParameters<typeof VersionService>[0]);
}

describe('VersionService', () => {
  afterEach(() => {
    vitest.unstubAllGlobals();
  });

  it('parses three and four component product versions with optional build metadata', () => {
    const service = createVersionService();

    expect(service.parseVersion('26.2.2')).toEqual({
      major: 26,
      minor: 2,
      patch: 2,
      revision: null,
      buildMetadata: null,
      version: '26.2.2',
    });
    expect(service.parseVersion('26.2.2.0+202609151230')).toEqual({
      major: 26,
      minor: 2,
      patch: 2,
      revision: 0,
      buildMetadata: '202609151230',
      version: '26.2.2.0',
    });
  });

  it.each(['26.2', '26.2.2.0.1', 'v26.2.2.0', '26.2.2.0+', '26.2.2-beta', '26.2.2+build_metadata'])(
    'rejects invalid product version %s',
    version => {
      expect(createVersionService().parseVersion(version)).toBeNull();
    },
  );

  it('compares every numeric component numerically', () => {
    const service = createVersionService();

    expect(service.compareVersions('26.2.2.10', '26.2.2.9')).toBe(1);
    expect(service.compareVersions('26.10.0', '26.9.99.99')).toBe(1);
    expect(service.compareVersions('26.2.2', '26.2.2.0')).toBe(0);
    expect(service.compareVersions('26.2.2.0+new-build', '26.2.2.0+old-build')).toBe(0);
    expect(service.greaterOrEqual('26.2.2.10', '26.2.2.9')).toBe(true);
  });

  it('throws when comparing an invalid product version', () => {
    expect(() => createVersionService().compareVersions('26.2.2.0.1', '26.2.2.0')).toThrow(TypeError);
  });

  it('keeps the public product version while removing build metadata from short versions', () => {
    vitest.stubGlobal('_VERSION_', '26.2.2.0+202609151230');
    const service = createVersionService('26.2.2+server-build');

    expect(service.getProductVersion()).toEqual({
      frontendVersion: '26.2.2.0+202609151230',
      backendVersion: '26.2.2+server-build',
    });
    expect(service.getProductVersion(true)).toEqual({
      frontendVersion: '26.2.2.0',
      backendVersion: '26.2.2',
    });
  });
});
