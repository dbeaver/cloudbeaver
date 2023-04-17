/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import axios, { AxiosProgressEvent, AxiosResponse } from 'axios';
import { GraphQLClient, ClientError, resolveRequestDocument } from 'graphql-request';
import { parseRequestArgs } from 'graphql-request/dist/parseArgs';
import type { RequestDocument, RequestOptions, Variables } from 'graphql-request/dist/types';
import type * as Dom from 'graphql-request/dist/types.dom';

import { GQLError } from './GQLError';
import type { IResponseInterceptor } from './IResponseInterceptor';
import { PlainGQLError } from './PlainGQLError';

export type UploadProgressEvent = AxiosProgressEvent;

type GqlResponse = (
  { data: object; errors: undefined }[]
  | { data: object; errors: undefined }
  | { data: undefined; errors: object }
  | { data: undefined; errors: object[] }
);

export class CustomGraphQLClient extends GraphQLClient {
  get blockReason(): Error | string | null {
    return this.requestsBlockedReason;
  }

  private readonly interceptors: IResponseInterceptor[] = [];
  private isRequestsBlocked = false;
  private requestsBlockedReason: Error | string | null = null;

  async uploadFile<T = any, V extends Variables = Variables>(
    url: string,
    files: FileList,
    query?: string,
    variables?: V,
    onUploadProgress?: (event: UploadProgressEvent) => void
  ): Promise<T> {
    return this.interceptors.reduce(
      (accumulator, interceptor) => interceptor(accumulator),
      this.overrideFileUpload<T, V>(url, files, query, variables, onUploadProgress)
    );
  }

  registerInterceptor(interceptor: IResponseInterceptor): void {
    this.interceptors.push(interceptor);
  }

  request<T = any, V = Variables>(document: RequestDocument, variables?: V, requestHeaders?: Dom.RequestInit['headers']): Promise<T>;
  request<T = any, V extends Variables = Variables>(options: RequestOptions<V>): Promise<T>;
  request<T = any, V extends Variables = Variables>(
    document: RequestDocument | RequestOptions<V>,
    variables?: V,
    requestHeaders?: Dom.RequestInit['headers']
  ): Promise<T> {
    return this.interceptors.reduce(
      (accumulator, interceptor) => interceptor(accumulator),
      this.overrideRequest<T, V>(document, variables, requestHeaders)
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

  private async overrideRequest<T, V extends Variables = Variables>(
    documentOrOptions: RequestDocument | RequestOptions<V>,
    variables?: V,
    requestHeaders?: Dom.RequestInit['headers']
  ): Promise<T> {
    this.blockRequestsReasonHandler();
    try {
      const requestOptions  = parseRequestArgs(documentOrOptions, variables, requestHeaders);
      const { query, operationName } = resolveRequestDocument(requestOptions.document);

      const response = await this.rawRequest<T, V>(query, variables, requestHeaders);

      // TODO: seems here can be undefined
      return response.data;
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

  private async overrideFileUpload<T, V extends Variables = Variables>(
    url: string,
    files: FileList,
    query?: string,
    variables?: V,
    onUploadProgress?: (event: UploadProgressEvent) => void
  ): Promise<T> {
    this.blockRequestsReasonHandler();
    try {
      const { operationName } = resolveRequestDocument(query ?? '');
      const response = await axios.postForm<GqlResponse>(url, {
        operationName,
        query,
        variables,
        'files[]': files,
      }, {
        onUploadProgress,
        responseType: 'json',
      });

      // TODO: seems here can be undefined
      return this.parseGQLResponse(response, query ?? '', variables);
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

  private parseGQLResponse<T>(
    response: AxiosResponse<GqlResponse>,
    query: string,
    variables?: Variables,
  ): T {
    const result = response.data;

    const successfullyReceivedData = Array.isArray(result)
      ? !result.some(({ data }) => !data)
      : Boolean(result.data);

    const successfullyPassedErrorPolicy = Array.isArray(result)
      || !result.errors
      || (Array.isArray(result.errors) && !result.errors.length);

    if (response.status === 200 && successfullyPassedErrorPolicy && successfullyReceivedData) {
      const data = result;
      const dataEnvelope = data;

      // @ts-expect-error TODO
      return {
        ...dataEnvelope,
        headers: response.headers,
        status: response.status,
      };
    } else {
      const errorResult
      = typeof result === 'string'
        ? {
          error: result,
        }
        : result;
      throw new ClientError(
      // @ts-expect-error TODO
        { ...errorResult, status: response.status, headers: response.headers },
        { query, variables }
      );
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
