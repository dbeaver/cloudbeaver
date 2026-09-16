/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { describe, expect, test } from 'vitest';

import type { UserInfo } from '@cloudbeaver/core-sdk';

import { AUTH_PROVIDER_LOCAL_ID } from './AUTH_PROVIDER_LOCAL_ID.js';
import { UserInfoResource } from './UserInfoResource.js';

function createResource(authTokens: Array<{ authProvider: string; authConfiguration?: string }> | null): UserInfoResource {
  const resource = Object.create(UserInfoResource.prototype) as UserInfoResource;
  Object.defineProperty(resource, 'data', {
    value: authTokens === null ? null : ({ authTokens } as unknown as UserInfo),
  });
  return resource;
}

describe('UserInfoResource.hasToken', () => {
  test('matches a configurable provider by provider and configuration', () => {
    const resource = createResource([
      { authProvider: 'ldap', authConfiguration: 'ldap-1' },
      { authProvider: 'ldap', authConfiguration: 'ldap-2' },
    ]);

    expect(resource.hasToken('ldap', 'ldap-1')).toBe(true);
    expect(resource.hasToken('ldap', 'ldap-2')).toBe(true);
    expect(resource.hasToken('ldap', 'ldap-3')).toBe(false);
    expect(resource.hasToken('openid', 'ldap-1')).toBe(false);
  });

  test('keeps provider-only and local-provider behavior', () => {
    const resource = createResource([{ authProvider: 'ldap', authConfiguration: 'ldap-1' }]);
    const unauthorizedResource = createResource(null);

    expect(resource.hasToken('ldap')).toBe(true);
    expect(unauthorizedResource.hasToken('ldap', 'ldap-1')).toBe(false);
    expect(unauthorizedResource.hasToken(AUTH_PROVIDER_LOCAL_ID, 'local-1')).toBe(true);
  });
});
