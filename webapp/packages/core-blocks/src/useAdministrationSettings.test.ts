/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { afterEach, beforeEach, describe, expect, test, vitest } from 'vitest';
import { renderHook } from '@testing-library/react';

import { EAdminPermission, type ServerConfigResource } from '@cloudbeaver/core-root';

import { useAdministrationSettings } from './useAdministrationSettings.js';

vitest.mock('./ResourcesHooks/useResource', () => ({
  useResource: vitest.fn(),
}));

vitest.mock('./usePermission', () => ({
  usePermission: vitest.fn(),
}));

vitest.mock('@cloudbeaver/core-root', async importOriginal => {
  const actual = (await importOriginal()) as object;

  return {
    ...actual,
    ServerConfigResource: vitest.fn(),
  };
});

describe('useAdministrationSettings', () => {
  let mockUsePermission: ReturnType<typeof vitest.fn>;
  let mockUseResource: ReturnType<typeof vitest.fn>;

  beforeEach(async () => {
    const { usePermission } = await import('./usePermission.js');
    const { useResource } = await import('./ResourcesHooks/useResource.js');

    mockUsePermission = usePermission as ReturnType<typeof vitest.fn>;
    mockUseResource = useResource as ReturnType<typeof vitest.fn>;
  });

  afterEach(() => {
    vitest.clearAllMocks();
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
