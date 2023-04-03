/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { GraphQLContext, GraphQLRequest, ResponseComposition } from 'msw';

import type { GetActiveUserQuery, GetActiveUserQueryVariables } from '@cloudbeaver/core-sdk';

export function mockGetActiveUser(
  req: GraphQLRequest<GetActiveUserQueryVariables>,
  res: ResponseComposition<GetActiveUserQuery>,
  ctx: GraphQLContext<GetActiveUserQuery>
) {
  return res(
    ctx.data({
      'user': null as unknown as undefined,
    }),
  );
}
