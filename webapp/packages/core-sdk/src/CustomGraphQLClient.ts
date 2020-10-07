/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { GraphQLClient } from 'graphql-request';
import { Variables, ClientError } from 'graphql-request/dist/src/types';

import { GQLError } from './GQLError';
import { IResponseInterceptor } from './IResponseInterceptor';

export class CustomGraphQLClient extends GraphQLClient {
  private interceptors: IResponseInterceptor[] = [];
  private isRequestsBlockedData: { status: boolean; reason: Error | string } = { status: false, reason: '' };

  constructor(endpoint: string) {
    super(endpoint);
  }

  registerInterceptor(interceptor: IResponseInterceptor): void {
    this.interceptors.push(interceptor);
  }

  request<T extends any>(query: string, variables?: Variables): Promise<T> {
    return this.interceptors.reduce(
      (accumulator, interceptor) => interceptor(accumulator),
      this.overrideRequest<T>(query, variables)
    );
  }

  blockRequests(reason: Error | string): void {
    this.isRequestsBlockedData.status = true;
    this.isRequestsBlockedData.reason = reason;
  }

  blockRequestsReasonHandler(): void {
    if(this.isRequestsBlockedData.reason instanceof Error) {
      throw this.isRequestsBlockedData.reason;
    } else { 
      throw new Error(this.isRequestsBlockedData.reason)
    }
  }

  private async overrideRequest<T>(query: string, variables?: Variables): Promise<T> {
    if(this.isRequestsBlockedData.status) {
      this.blockRequestsReasonHandler();
    }

    try {
      const response = await this.rawRequest<T>(query, variables);

      // TODO: seems here can be undefined
      return response.data as T;
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
