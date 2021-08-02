/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { GraphQLClient } from 'graphql-request';
import { Variables, ClientError } from 'graphql-request/dist/src/types';

import { GQLError } from './GQLError';
import type { IResponseInterceptor } from './IResponseInterceptor';

export class CustomGraphQLClient extends GraphQLClient {
  get blockReason(): Error | string | null {
    return this.requestsBlockedReason;
  }

  private interceptors: IResponseInterceptor[] = [];
  private isRequestsBlocked = false;
  private requestsBlockedReason: Error | string | null = null;

  registerInterceptor(interceptor: IResponseInterceptor): void {
    this.interceptors.push(interceptor);
  }

  request<T extends any>(query: string, variables?: Variables): Promise<T> {
    return this.interceptors.reduce(
      (accumulator, interceptor) => interceptor(accumulator),
      this.overrideRequest<T>(query, variables)
    );
  }

  enableRequests(): void {
    this.isRequestsBlocked = false;
    this.requestsBlockedReason = null;
  }

  blockRequests(reason: Error | string): void {
    this.isRequestsBlocked = true;
    this.requestsBlockedReason = reason;
  }

  private blockRequestsReasonHandler(): void {
    if (this.isRequestsBlocked) {
      if (this.requestsBlockedReason instanceof Error) {
        throw this.requestsBlockedReason;
      } else {
        throw new Error(this.requestsBlockedReason ?? undefined);
      }
    }
  }

  private async overrideRequest<T>(query: string, variables?: Variables): Promise<T> {
    this.blockRequestsReasonHandler();
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
