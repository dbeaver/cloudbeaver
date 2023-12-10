/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { HttpResponse, ResponseResolverReturnType } from 'msw';

import type { ServerConfigQuery } from '@cloudbeaver/core-sdk';

import { defaultServerConfig } from '../data/defaultServerConfig';
import type { GraphQLResponseBody } from './IGraphQLResponseBody';
import type { IResponseResolverInfo } from './IResponseResolverInfo';

export function mockServerConfig(productConfiguration?: Record<string, any>) {
  return function mockServerConfig(info: IResponseResolverInfo): ResponseResolverReturnType<GraphQLResponseBody<ServerConfigQuery>> {
    return HttpResponse.json({ data: defaultServerConfig(productConfiguration) });
  };
}
