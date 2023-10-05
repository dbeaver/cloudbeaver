/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { GraphQLContext, GraphQLRequest, ResponseComposition } from 'msw';

import type { ServerConfigQuery, ServerConfigQueryVariables } from '@cloudbeaver/core-sdk';

import { defaultServerConfig } from '../data/defaultServerConfig';

export function mockServerConfig(productConfiguration?: Record<string, any>) {
  return function mockServerConfig(
    req: GraphQLRequest<ServerConfigQueryVariables>,
    res: ResponseComposition<ServerConfigQuery>,
    ctx: GraphQLContext<ServerConfigQuery>,
  ) {
    return res(ctx.data(defaultServerConfig(productConfiguration)));
  };
}
