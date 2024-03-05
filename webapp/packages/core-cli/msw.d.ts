/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { GraphQLError } from 'graphql';
import { DefaultBodyType, GraphQLVariables } from 'msw';

// types are not exported: https://github.com/mswjs/msw/pull/1826
declare module 'msw' {
  export type GraphQLResolverExtras<Variables extends GraphQLVariables> = {
    query: string;
    operationName: string;
    variables: Variables;
    cookies: Record<string, string>;
  };

  export interface GraphQLResponseBody<BodyType extends DefaultBodyType> {
    data?: BodyType | null;
    errors?: readonly Partial<GraphQLError>[] | null;
  }
}
