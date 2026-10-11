/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { describe, expect, it, vi } from 'vitest';

import { Executor, ExecutorInterrupter } from '@cloudbeaver/core-executor';

import { ConnectionsManagerService } from './ConnectionsManagerService.js';

type Dependencies = ConstructorParameters<typeof ConnectionsManagerService>;
const KEY = { projectId: 'project', connectionId: 'connection' };

function setup(canDelete = true) {
  const connections = {
    load: vi.fn().mockResolvedValue({ canDelete }),
    deleteConnection: vi.fn().mockResolvedValue(undefined),
    onConnectionClose: new Executor(),
  };
  const service = new ConnectionsManagerService(
    connections as unknown as Dependencies[0],
    {} as Dependencies[1],
    {} as Dependencies[2],
    {} as Dependencies[3],
  );
  return { service, connections };
}

describe('ConnectionsManagerService deletion', () => {
  it('executes an already confirmed deletion through the existing lifecycle', async () => {
    const { service, connections } = setup();
    const before = vi.fn();
    service.onDelete.addHandler(data => {
      if (data.state === 'before') {
        before(data.connections);
        expect(connections.deleteConnection).not.toHaveBeenCalled();
      }
    });

    await expect(service.deleteConnection(KEY)).resolves.toBe(true);

    expect(before).toHaveBeenCalledExactlyOnceWith([KEY]);
    expect(connections.deleteConnection).toHaveBeenCalledExactlyOnceWith(KEY);
  });

  it('keeps disconnect/editor guards able to cancel deletion', async () => {
    const { service, connections } = setup();
    service.onDisconnect.addHandler((_data, contexts) => ExecutorInterrupter.interrupt(contexts));

    await expect(service.deleteConnection(KEY)).resolves.toBe(false);

    expect(connections.deleteConnection).not.toHaveBeenCalled();
  });

  it('rechecks permissions after the UI confirmation', async () => {
    const { service, connections } = setup(false);

    await expect(service.deleteConnection(KEY)).resolves.toBe(false);

    expect(connections.deleteConnection).not.toHaveBeenCalled();
  });
});
