/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import axios, { type AxiosProgressEvent, CanceledError, isAxiosError, isCancel } from 'axios';
import { analyzeDocument, ClientError, GraphQLClient, type RequestDocument, type RequestOptions, type Variables } from 'graphql-request';

import { GQLError } from './GQLError.js';
import type { IResponseInterceptor } from './IResponseInterceptor.js';
import { PlainGQLError } from './PlainGQLError.js';
import { ServerInternalError } from './ServerInternalError.js';

export type UploadProgressEvent = AxiosProgressEvent;

// type GqlResponse =
//   | { data: object; errors: undefined }[]
//   | { data: object; errors: undefined }
//   | { data: undefined; errors: object }
//   | { data: undefined; errors: object[] };

export class CustomGraphQLClient extends GraphQLClient {
  get blockReason(): Error | string | null {
    return this.requestsBlockedReason;
  }

  private readonly interceptors: IResponseInterceptor[] = [];
  private isRequestsBlocked = false;
  private requestsBlockedReason: Error | string | null = null;

  uploadFile<T = any, V extends Variables = Variables>(
    url: string,
    file: Blob,
    query?: string,
    variables?: V,
    onUploadProgress?: (event: UploadProgressEvent) => void,
    signal?: AbortSignal,
  ): Promise<T> {
    return this.interceptors.reduce(
      (accumulator, interceptor) => interceptor(accumulator),
      this.overrideFilesUpload<T, V>(url, file, query, variables, onUploadProgress, signal),
    );
  }

  uploadFiles<T = any, V extends Variables = Variables>(
    url: string,
    files: File[],
    query?: string,
    variables?: V,
    onUploadProgress?: (event: UploadProgressEvent) => void,
  ): Promise<T> {
    return this.interceptors.reduce(
      (accumulator, interceptor) => interceptor(accumulator),
      this.overrideFilesUpload<T, V>(url, files, query, variables, onUploadProgress),
    );
  }

  registerInterceptor(interceptor: IResponseInterceptor): void {
    this.interceptors.push(interceptor);
  }

  override request<T = any, V = Variables>(document: RequestDocument, variables?: V, requestHeaders?: HeadersInit): Promise<T>;
  override request<T = any, V extends Variables = Variables>(options: RequestOptions<V>): Promise<T>;
  override request<T = any, V extends Variables = Variables>(
    document: RequestDocument | RequestOptions<V>,
    variables?: V,
    requestHeaders?: HeadersInit,
  ): Promise<T> {
    return this.interceptors.reduce(
      (accumulator, interceptor) => interceptor(accumulator),
      this.overrideRequest<T, V>(document, variables, requestHeaders),
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
    requestHeaders?: HeadersInit,
  ): Promise<T> {
    this.blockRequestsReasonHandler();
    try {
      const requestOptions = parseRequestArgs(documentOrOptions, variables, requestHeaders);
      const { expression } = analyzeDocument(requestOptions.document);

      const response = await this.rawRequest<T, V>(expression, variables, requestHeaders);

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

  private async overrideFilesUpload<T, V extends Variables = Variables>(
    url: string,
    files: File[] | Blob,
    query?: string,
    variables?: V,
    onUploadProgress?: (event: UploadProgressEvent) => void,
    signal?: AbortSignal,
  ): Promise<T> {
    this.blockRequestsReasonHandler();
    try {
      const { operationName } = analyzeDocument(query ?? '');
      // TODO: we don't support GQL response right now
      const data = {
        operationName,
        query,
        variables: JSON.stringify(variables),
        'files[]': undefined as any,
        fileData: undefined as any,
      };

      if (files instanceof Array) {
        data['files[]'] = files;
      } else {
        data.fileData = files;
      }

      const response = await axios.postForm/*<GqlResponse>*/ <T>(url, data, {
        signal,
        onUploadProgress,
        responseType: 'json',
      });

      // TODO: we don't support GQL response right now
      // TODO: seems here can be undefined
      // return this.parseGQLResponse(response, query ?? '', variables);

      return response.data;
    } catch (error: any) {
      if (isCancel(error)) {
        throw new CanceledError('ui_processing_canceled');
      }

      if (isAxiosError(error) && error.response?.data.message) {
        throw new ServerInternalError({ ...error, message: error.response.data.message });
      }

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

function parseRequestArgs<V extends Variables = Variables>(
  documentOrOptions: RequestDocument | RequestOptions<V>,
  variables?: V,
  requestHeaders?: HeadersInit,
): RequestOptions<V> {
  if ((documentOrOptions as RequestOptions<V>).document) {
    return documentOrOptions as RequestOptions<V>;
  }

  return {
    document: documentOrOptions as RequestDocument,
    variables,
    requestHeaders,
    signal: undefined,
  } as unknown as RequestOptions<V>;
}
