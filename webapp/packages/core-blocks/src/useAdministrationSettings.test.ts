/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { afterEach, beforeEach, describe, expect, test, vitest, type MockInstance } from 'vitest';
import { renderHook } from '@testing-library/react';

import { EAdminPermission, type ServerConfigResource } from '@cloudbeaver/core-root';

import { useAdministrationSettings } from './useAdministrationSettings.js';
import * as resource from './ResourcesHooks/useResource.js';
import * as permission from './usePermission.js';

describe('useAdministrationSettings', () => {
  let mockUsePermission: MockInstance<typeof permission.usePermission>;
  let mockUseResource: MockInstance<typeof resource.useResource>;

  beforeEach(() => {
    mockUsePermission = vitest.spyOn(permission, 'usePermission');
    mockUseResource = vitest.spyOn(resource, 'useResource');
  });

  afterEach(() => {
    vitest.restoreAllMocks();
  });

  test('should return credentialsSavingEnabled as true for admin users with admin save enabled', () => {
    mockUsePermission.mockReturnValue(true);
    mockUseResource.mockReturnValue({
      resource: {
        configurationMode: false,
        adminCredentialsSaveEnabled: true,
        publicCredentialsSaveEnabled: false,
      } as ServerConfigResource,
    });

    const { result } = renderHook(() => useAdministrationSettings());

    expect(result.current.credentialsSavingEnabled).toBe(true);
  });

  test('should return credentialsSavingEnabled as false for non-admin users with public save disabled', () => {
    mockUsePermission.mockReturnValue(false);
    mockUseResource.mockReturnValue({
      resource: {
        configurationMode: false,
        adminCredentialsSaveEnabled: true,
        publicCredentialsSaveEnabled: false,
      } as ServerConfigResource,
    });

    const { result } = renderHook(() => useAdministrationSettings());

    expect(result.current.credentialsSavingEnabled).toBe(false);
  });

  test('should return credentialsSavingEnabled as true for non-admin users with public save enabled', () => {
    mockUsePermission.mockReturnValue(false);
    mockUseResource.mockReturnValue({
      resource: {
        configurationMode: false,
        adminCredentialsSaveEnabled: true,
        publicCredentialsSaveEnabled: true,
      } as ServerConfigResource,
    });

    const { result } = renderHook(() => useAdministrationSettings());

    expect(result.current.credentialsSavingEnabled).toBe(true);
  });

  test('should return credentialsSavingEnabled as true in configuration mode', () => {
    mockUsePermission.mockReturnValue(false);
    mockUseResource.mockReturnValue({
      resource: {
        configurationMode: true,
        adminCredentialsSaveEnabled: false,
        publicCredentialsSaveEnabled: false,
      } as ServerConfigResource,
    });

    const { result } = renderHook(() => useAdministrationSettings());

    expect(result.current.credentialsSavingEnabled).toBe(true);
  });

  test('should return credentialsSavingEnabled as false when admin save is disabled', () => {
    mockUsePermission.mockReturnValue(false);
    mockUseResource.mockReturnValue({
      resource: {
        configurationMode: false,
        adminCredentialsSaveEnabled: false,
        publicCredentialsSaveEnabled: false,
      } as ServerConfigResource,
    });

    const { result } = renderHook(() => useAdministrationSettings());

    expect(result.current.credentialsSavingEnabled).toBe(false);
  });

  test('should call usePermission with EAdminPermission.admin', () => {
    mockUsePermission.mockReturnValue(false);
    mockUseResource.mockReturnValue({
      resource: {
        configurationMode: false,
        adminCredentialsSaveEnabled: false,
        publicCredentialsSaveEnabled: false,
      } as ServerConfigResource,
    });

    renderHook(() => useAdministrationSettings());

    expect(mockUsePermission).toHaveBeenCalledWith(EAdminPermission.admin);
  });

  test('should call useResource with ServerConfigResource', async () => {
    const { ServerConfigResource } = await import('@cloudbeaver/core-root');

    mockUsePermission.mockReturnValue(false);
    mockUseResource.mockReturnValue({
      resource: {
        configurationMode: false,
        adminCredentialsSaveEnabled: false,
        publicCredentialsSaveEnabled: false,
      } as ServerConfigResource,
    });

    renderHook(() => useAdministrationSettings());

    expect(mockUseResource).toHaveBeenCalledWith(useAdministrationSettings, ServerConfigResource, undefined);
  });
});
