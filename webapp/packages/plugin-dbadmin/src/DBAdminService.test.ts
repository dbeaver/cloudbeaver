/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { describe, expect, test, vi } from 'vitest';

import type { GraphQLService } from '@cloudbeaver/core-sdk';

import { DBAdminService } from './DBAdminService.js';

const connection = { projectId: 'project', connectionId: 'connection' };

function createService(sdk: Record<string, (...args: any[]) => Promise<any>>) {
  return new DBAdminService({ sdk } as unknown as GraphQLService);
}

async function flushRequests() {
  await new Promise(resolve => setTimeout(resolve, 0));
}

describe('DBAdminService', () => {
  test('requests connection features once and caches them', async () => {
    const dbAdminGetInfo = vi.fn().mockResolvedValue({ info: { sessionsSupported: true, locksSupported: false } });
    const service = createService({ dbAdminGetInfo });

    expect(service.getInfo(connection)).toBeUndefined();
    expect(service.getInfo(connection)).toBeUndefined();

    await flushRequests();

    expect(dbAdminGetInfo).toHaveBeenCalledTimes(1);
    expect(dbAdminGetInfo).toHaveBeenCalledWith(connection);
    expect(service.getInfo(connection)).toEqual({ sessionsSupported: true, locksSupported: false });
    expect(dbAdminGetInfo).toHaveBeenCalledTimes(1);
  });

  test('caches a failed features request as null', async () => {
    const dbAdminGetInfo = vi.fn().mockRejectedValue(new Error('not connected'));
    const service = createService({ dbAdminGetInfo });

    service.getInfo(connection);
    await flushRequests();

    expect(service.getInfo(connection)).toBeNull();
    expect(dbAdminGetInfo).toHaveBeenCalledTimes(1);
  });

  test('sends only connection params with session requests', async () => {
    const dbAdminListSessions = vi.fn().mockResolvedValue({ list: { columns: [], sessions: [] } });
    const dbAdminTerminateSessions = vi.fn().mockResolvedValue({ result: true });
    const service = createService({ dbAdminListSessions, dbAdminTerminateSessions });
    const connectionInfo = { ...connection, name: 'Warehouse', connected: true };

    await service.listSessions(connectionInfo, true);
    await service.terminateSessions(connectionInfo, ['42'], false);

    expect(dbAdminListSessions).toHaveBeenCalledWith({ ...connection, showIdle: true });
    expect(dbAdminTerminateSessions).toHaveBeenCalledWith({ ...connection, sessionIds: ['42'], cancelQueryOnly: false });
  });
});
