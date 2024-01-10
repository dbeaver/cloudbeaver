/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { GraphQLResolverExtras, GraphQLResponseBody, HttpResponse, ResponseResolver } from 'msw';

import type { GetActiveUserQuery, GetActiveUserQueryVariables } from '@cloudbeaver/core-sdk';

export const mockGetActiveUser: ResponseResolver<
  GraphQLResolverExtras<GetActiveUserQueryVariables>,
  null,
  GraphQLResponseBody<GetActiveUserQuery>
> = function mockGetActiveUser() {
  return HttpResponse.json({
    data: {
      user: null as unknown as undefined,
    },
  });
};
