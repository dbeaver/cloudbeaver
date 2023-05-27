/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { GraphQLContext, GraphQLRequest, ResponseComposition } from 'msw';

import type { OpenSessionMutation, OpenSessionMutationVariables } from '@cloudbeaver/core-sdk';

export function mockOpenSession(
  req: GraphQLRequest<OpenSessionMutationVariables>,
  res: ResponseComposition<OpenSessionMutation>,
  ctx: GraphQLContext<OpenSessionMutation>,
) {
  const date = new Date().toISOString();
  return res(
    ctx.data({
      session: {
        createTime: date,
        lastAccessTime: date,
        cacheExpired: false,
        locale: req.variables.defaultLocale ?? 'en',
        actionParameters: null,
      },
    }),
  );
}
