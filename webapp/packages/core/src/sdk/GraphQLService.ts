/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { GraphQLClient } from 'graphql-request';
import { Variables, ClientError } from 'graphql-request/dist/src/types';

import { injectable } from '@dbeaver/core/di';

import { EnvironmentService } from './EnvironmentService';
import { GQLError } from './GQLError';
import { IResponseInterceptor } from './IResponseInterceptor';
import { getSdk } from './sdk';

@injectable()
export class GraphQLService {
  gql: ReturnType<typeof getSdk>
  private client: GraphQLClient;

  private interceptors: IResponseInterceptor[] = [];

  constructor(private environmentService: EnvironmentService) {
    const gqlEndpoint = this.environmentService.gqlEndpoint;
    this.client = new GraphQLClient(gqlEndpoint);
    this.gql = getSdk({ ...this.client, request: this.interceptedRequest.bind(this) } as any);
  }

  registerInterceptor(interceptor: IResponseInterceptor): void {
    this.interceptors.push(interceptor);
  }

  private interceptedRequest(query: string, variables?: Variables) {
    return this.interceptors.reduce(
      (accumulator, interceptor) => interceptor(accumulator),
      this.overrideRequest(query, variables)
    );
  }

  private async overrideRequest(query: string, variables?: Variables) {
    try {
      const response = await this.client.rawRequest(query, variables);

      return response.data;
    } catch (error) {
      if (isClientError(error)) {
        throw new GQLError(error);
      }
      throw error;
    }
  }
}


function isClientError(obj: any): obj is ClientError {
  // in es5 build `instanceof ClientError` always false, so we try to determine by checking response property
  return obj instanceof ClientError || obj.response;
}
