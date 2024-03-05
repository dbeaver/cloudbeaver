/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { GraphQLResolverExtras, GraphQLResponseBody, HttpResponse, ResponseResolver } from 'msw';

import type { ServerConfigQuery, ServerConfigQueryVariables } from '@cloudbeaver/core-sdk';

import { defaultServerConfig } from '../data/defaultServerConfig';

export function mockServerConfig(
  productConfiguration?: Record<string, any>,
): ResponseResolver<GraphQLResolverExtras<ServerConfigQueryVariables>, null, GraphQLResponseBody<ServerConfigQuery>> {
  return function mockServerConfig() {
    return HttpResponse.json({ data: defaultServerConfig(productConfiguration) });
  };
}
