/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { HttpResponse, type GraphQLResponseResolver } from 'msw';

import type { OpenSessionMutation, OpenSessionMutationVariables } from '@cloudbeaver/core-sdk';

export const mockOpenSession: GraphQLResponseResolver<
OpenSessionMutation, OpenSessionMutationVariables
> = function mockOpenSession(info) {
  const date = new Date().toISOString();

  return HttpResponse.json({
    data: {
      session: {
        valid: true,
        remainingTime: 0,
        createTime: date,
        lastAccessTime: date,
        cacheExpired: false,
        locale: info.variables.defaultLocale ?? 'en',
        actionParameters: null,
      },
    },
  });
};
