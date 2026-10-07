/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { describe, expect, it, vitest } from 'vitest';

import { CreateTeamService } from './Teams/TeamsTable/CreateTeamService.js';
import { CreateUserService } from './UsersTable/CreateUserService.js';

describe('create form services', () => {
  it.each([
    ['user', CreateUserService],
    ['team', CreateTeamService],
  ])('preserves the %s form when panel closing is rejected', async (_, Service) => {
    const close = vitest.fn().mockResolvedValue(false);
    const dispose = vitest.fn();
    const service = new Service(
      {} as never,
      {} as never,
      {
        close,
        closeTask: { addHandler: vitest.fn() },
      } as never,
      {} as never,
    );
    service.formState = { dispose } as never;

    await service.cancelCreate();

    expect(close).toHaveBeenCalledOnce();
    expect(dispose).not.toHaveBeenCalled();
    expect(service.formState).not.toBeNull();
  });
});
