/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { describe, expect, it, vi } from 'vitest';

import { type CommonDialogService, DialogueStateResult } from '@cloudbeaver/core-dialogs';
import type { LocalizationService } from '@cloudbeaver/core-localization';
import type { ResourceManagerResource } from '@cloudbeaver/core-resource-manager';

import { NavResourceNodeService } from './NavResourceNodeService.js';

function setup() {
  const resource = { deleteResource: vi.fn() };
  const dialog = { open: vi.fn().mockResolvedValue({ status: DialogueStateResult.Resolved }) };
  const service = new NavResourceNodeService(
    resource as unknown as ResourceManagerResource,
    dialog as unknown as CommonDialogService,
    { translate: (_: string, __: unknown, args: { name: string }) => args.name } as LocalizationService,
  );
  return { service, resource, dialog };
}

describe('resource selection deletion', () => {
  it('confirms scripts and datasets together before deleting them', async () => {
    const { service, resource, dialog } = setup();
    const keys = ['project/scripts/query.sql', 'project/datasets/data.json'];

    await service.delete(keys);

    expect(dialog.open).toHaveBeenCalledTimes(1);
    expect(dialog.open).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ message: 'query.sql, data.json' }));
    expect(resource.deleteResource.mock.calls).toEqual(keys.map(key => [key]));
  });

  it('does not delete any resource when cancelled', async () => {
    const { service, resource, dialog } = setup();
    dialog.open.mockResolvedValue({ status: DialogueStateResult.Rejected });

    await service.delete(['project/first.sql', 'project/second.sql']);

    expect(resource.deleteResource).not.toHaveBeenCalled();
  });

  it('stops on failure and propagates the error to the action handler', async () => {
    const { service, resource } = setup();
    const error = new Error('Deletion failed');
    resource.deleteResource.mockRejectedValueOnce(error);

    await expect(service.delete(['project/first.sql', 'project/second.sql'])).rejects.toBe(error);

    expect(resource.deleteResource).toHaveBeenCalledTimes(1);
  });

  it('continues to accept a single resource key', async () => {
    const { service, resource } = setup();

    await service.delete('project/query.sql');

    expect(resource.deleteResource).toHaveBeenCalledWith('project/query.sql');
  });
});
