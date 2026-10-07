/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { describe, expect, it, vitest } from 'vitest';

import { DialogueStateResult } from '@cloudbeaver/core-dialogs';
import { Executor, ExecutorInterrupter } from '@cloudbeaver/core-executor';
import { type OptionsPanelCloseEventData, OptionsPanelService } from '@cloudbeaver/core-ui';

import { CreateTeamService } from './Teams/TeamsTable/CreateTeamService.js';
import { CreateUserService } from './UsersTable/CreateUserService.js';

describe('create form services', () => {
  const services = [
    ['user', CreateUserService],
    ['team', CreateTeamService],
  ] as const;

  it.each(services)('preserves the %s form when panel closing is rejected', async (_, Service) => {
    const dispose = vitest.fn();
    const commonDialogService = {
      open: vitest.fn().mockResolvedValue({ status: DialogueStateResult.Rejected }),
    };
    const optionsPanelService = createOptionsPanelService();
    const service = new Service(
      {} as never,
      {} as never,
      optionsPanelService,
      commonDialogService as never,
    );
    service.formState = { dispose, isChanged: true } as never;

    await service.cancelCreate();

    expect(commonDialogService.open).toHaveBeenCalledOnce();
    expect(dispose).not.toHaveBeenCalled();
    expect(service.formState).not.toBeNull();
  });

  it.each(services)('disposes the %s form after panel closing succeeds', async (_, Service) => {
    const dispose = vitest.fn();
    const optionsPanelService = createOptionsPanelService();
    const service = new Service(
      {} as never,
      {} as never,
      optionsPanelService,
      {
        open: vitest.fn().mockResolvedValue({ status: DialogueStateResult.Resolved }),
      } as never,
    );
    service.formState = { dispose, isChanged: true } as never;

    await service.cancelCreate();

    expect(dispose).toHaveBeenCalledOnce();
    expect(service.formState).toBeNull();
  });
});

function createOptionsPanelService(): OptionsPanelService {
  const closeTask = new Executor<OptionsPanelCloseEventData>();

  return {
    closeTask,
    isOpen: () => true,
    close: async () => {
      const contexts = await closeTask.execute('before');

      if (ExecutorInterrupter.isInterrupted(contexts)) {
        return false;
      }

      await closeTask.execute('after');
      return true;
    },
  } as unknown as OptionsPanelService;
}
