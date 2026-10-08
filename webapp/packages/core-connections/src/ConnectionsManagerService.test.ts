/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { describe, expect, it, vi } from 'vitest';

import { DialogueStateResult } from '@cloudbeaver/core-dialogs';
import { Executor, ExecutorInterrupter } from '@cloudbeaver/core-executor';
import { resourceKeyList } from '@cloudbeaver/core-resource';

import { ConnectionsManagerService } from './ConnectionsManagerService.js';
import type { IConnectionInfoParams } from './CONNECTION_INFO_PARAM_SCHEMA.js';

function setup() {
  const resource = {
    load: vi.fn().mockResolvedValue([
      { name: 'First', canDelete: true },
      { name: 'Second', canDelete: true },
    ]),
    deleteConnection: vi.fn(),
    onConnectionClose: new Executor<IConnectionInfoParams>(),
  };
  const dialog = { open: vi.fn().mockResolvedValue({ status: DialogueStateResult.Resolved }) };
  const service = new ConnectionsManagerService(
    ...([resource, {}, {}, dialog, {}] as unknown as ConstructorParameters<typeof ConnectionsManagerService>),
  );
  const keys = resourceKeyList([
    { projectId: 'project', connectionId: 'first' },
    { projectId: 'project', connectionId: 'second' },
  ]);
  return { service, resource, dialog, keys };
}

describe('connection selection deletion', () => {
  it('checks each connection lifecycle before deleting the confirmed batch', async () => {
    const { service, resource, dialog, keys } = setup();
    const beforeDelete = vi.fn();
    service.onDelete.addHandler(beforeDelete);

    await service.deleteConnection(keys, true);

    expect(dialog.open).not.toHaveBeenCalled();
    for (const key of keys) {
      expect(beforeDelete).toHaveBeenCalledWith(expect.objectContaining({ connections: [key], state: 'before' }), expect.anything());
    }
    expect(resource.deleteConnection).toHaveBeenCalledWith(keys);
  });

  it('deletes no connections if an unsaved-data or transaction prompt interrupts the lifecycle', async () => {
    const { service, resource, keys } = setup();
    const checkConnection = vi.fn((data, context) => {
      if (data.connections[0].connectionId === 'second') {
        ExecutorInterrupter.interrupt(context);
      }
    });
    service.onDisconnect.addHandler(checkConnection);

    await service.deleteConnection(keys, true);

    expect(resource.deleteConnection).not.toHaveBeenCalled();
    expect(checkConnection).toHaveBeenCalledTimes(2);
  });

  it('checks permissions again before deletion', async () => {
    const { service, resource, keys } = setup();
    resource.load.mockResolvedValue([
      { name: 'First', canDelete: true },
      { name: 'Second', canDelete: false },
    ]);

    await service.deleteConnection(keys, true);

    expect(resource.deleteConnection).not.toHaveBeenCalled();
  });
});
