/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { ConnectionInfoResource } from '@cloudbeaver/core-connections';
import { SyncExecutor } from '@cloudbeaver/core-executor';
import { AiDatabaseScope, type GraphQLService } from '@cloudbeaver/core-sdk';

import { ConnectionInfoAiResource } from './ConnectionInfoAiResource.js';
import { ConnectionInfoAiScopeResource } from './ConnectionInfoAiScopeResource.js';

const key = { projectId: 'project', connectionId: 'connection' };

function setup(connected = false) {
  const settings = { metaTransferConfirmed: true, scope: AiDatabaseScope.Custom };
  const sdk = {
    getUserConnectionAiSettings: vi.fn().mockResolvedValue({ settings }),
    saveUserConnectionAiSettings: vi.fn().mockResolvedValue({ settings }),
    getUserConnectionAiScope: vi.fn().mockResolvedValue({ scope: { customObjectIds: ['table'] } }),
  };
  const connections = {
    isConnected: vi.fn(() => connected),
    load: vi.fn().mockResolvedValue({ connected }),
    connect: vi.fn(),
    outdateResource: vi.fn(),
    onItemDelete: new SyncExecutor(null),
    onDataUpdate: new SyncExecutor(null),
    logger: { logExecutor: () => vi.fn(), getName: () => 'ConnectionInfoResource' },
  };
  const resource = new ConnectionInfoAiResource({ sdk } as unknown as GraphQLService, connections as unknown as ConnectionInfoResource);
  const scopeResource = new ConnectionInfoAiScopeResource(
    { sdk } as unknown as GraphQLService,
    connections as unknown as ConnectionInfoResource,
    resource,
  );
  return { resource, scopeResource, sdk, connections };
}

describe('Connection AI settings after disconnect', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('stops resolving scope objects when disconnected settings are reloaded', async () => {
    const { resource, scopeResource, sdk, connections } = setup(true);
    await resource.load(key);
    await scopeResource.load(key);
    expect(sdk.getUserConnectionAiScope).toHaveBeenCalledTimes(1);

    connections.isConnected.mockReturnValue(false);
    resource.markOutdated(key);
    const settings = await resource.load(key);

    expect(sdk.getUserConnectionAiSettings).toHaveBeenLastCalledWith({ dataSourceId: key });
    expect(settings.scope).toBe(AiDatabaseScope.Custom);
    scopeResource.markOutdated(key);
    await scopeResource.load(key);
    expect(scopeResource.isOutdated(key)).toBe(true);
    expect(scopeResource.getException(key)).toBeNull();
    expect(sdk.getUserConnectionAiScope).toHaveBeenCalledTimes(1);

    connections.isConnected.mockReturnValue(true);
    resource.markOutdated(key);
    await scopeResource.refresh(key);
    expect(sdk.getUserConnectionAiScope).toHaveBeenCalledTimes(2);
  });

  it('interrupts the initial scope load while disconnected without marking it loaded', async () => {
    const { scopeResource, sdk } = setup(false);

    await scopeResource.load(key);

    expect(sdk.getUserConnectionAiScope).not.toHaveBeenCalled();
    expect(scopeResource.isLoaded(key)).toBe(false);
    expect(scopeResource.get(key)).toBeUndefined();
    expect(scopeResource.getException(key)).toBeNull();
  });

  it.each([false, true])('saves settings without resolving objects (connected=%s)', async connected => {
    const { resource, scopeResource, sdk } = setup(connected);
    if (connected) {
      await scopeResource.load(key);
      expect(scopeResource.isOutdated(key)).toBe(false);
    }
    sdk.getUserConnectionAiScope.mockClear();
    const settings = { metaTransferConfirmed: false };
    await resource.save(key, settings);
    expect(sdk.saveUserConnectionAiSettings).toHaveBeenCalledWith({ dataSourceId: key, settings });
    expect(sdk.getUserConnectionAiScope).not.toHaveBeenCalled();
    expect(scopeResource.isOutdated(key)).toBe(true);
  });
});
