/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { GraphQLClient, ClientError } from 'graphql-request';
import type { RequestDocument, Variables } from 'graphql-request/dist/types';
import type * as Dom from 'graphql-request/dist/types.dom';

import { GQLError } from './GQLError';
import type { IResponseInterceptor } from './IResponseInterceptor';
import { PlainGQLError } from './PlainGQLError';

export class CustomGraphQLClient extends GraphQLClient {
  get blockReason(): Error | string | null {
    return this.requestsBlockedReason;
  }

  private readonly interceptors: IResponseInterceptor[] = [];
  private isRequestsBlocked = false;
  private requestsBlockedReason: Error | string | null = null;

  registerInterceptor(interceptor: IResponseInterceptor): void {
    this.interceptors.push(interceptor);
  }

  // @ts-expect-error should be fixed somehow
  request<T = any, V = Variables>(
    document: RequestDocument,
    variables?: V,
    requestHeaders?: Dom.RequestInit['headers']
  ): Promise<T> {
    return this.interceptors.reduce(
      (accumulator, interceptor) => interceptor(accumulator),
      this.overrideRequest<T>(document as string, variables, requestHeaders)
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

  private async overrideRequest<T>(query: string, variables?: Variables, requestHeaders?: Dom.RequestInit['headers']): Promise<T> {
    this.blockRequestsReasonHandler();
    try {
      const response = await this.rawRequest<T>(query, variables, requestHeaders);

      // TODO: seems here can be undefined
      return response.data as T;
    } catch (error: any) {
      if (isClientError(error)) {
        if (isObjectError(error)) {
          throw new GQLError(error);
        } else {
          throw new PlainGQLError(error);
        }
      }

      throw error;
    }
  }
}

function isClientError(obj: any): obj is ClientError {
  // in es5 build `instanceof ClientError` always false, so we try to determine by checking response property
  return obj instanceof ClientError || obj.response;
}

function isObjectError(obj: ClientError) {
  return !!obj.response.errors;
}
