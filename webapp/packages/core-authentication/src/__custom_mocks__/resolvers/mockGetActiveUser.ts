/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { DefaultBodyType, GraphQLVariables, HttpResponse, ResponseResolverReturnType, StrictRequest } from 'msw';

import type { GetActiveUserQuery } from '@cloudbeaver/core-sdk';

type ResponseResolverInfo<ResolverExtraInfo extends Record<string, unknown>, RequestBodyType extends DefaultBodyType = DefaultBodyType> = {
  request: StrictRequest<RequestBodyType>;
} & ResolverExtraInfo;

type GraphQLResolverExtras<Variables extends GraphQLVariables> = {
  query: string;
  operationName: string;
  variables: Variables;
  cookies: Record<string, string>;
};

interface GraphQLResponseBody<BodyType extends DefaultBodyType> {
  data?: BodyType | null;
}

export function mockGetActiveUser(
  info: ResponseResolverInfo<GraphQLResolverExtras<GraphQLVariables>, null>,
): ResponseResolverReturnType<GraphQLResponseBody<GetActiveUserQuery>> {
  return HttpResponse.json({
    data: {
      user: null as unknown as undefined,
    },
  });
}
