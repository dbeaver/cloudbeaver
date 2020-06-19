/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

/// <reference path="types.d.ts" />

import { GraphQLResponse, GraphQLRequestContext, ClientError } from 'graphql-request/dist/src/types';

export class GQLError extends Error {
  response: GraphQLResponse;
  request: GraphQLRequestContext;
  errorText: string;
  errorCode?: string;
  isTextBody = false; // true when server returns not GQLError object but plain text or html error

  constructor(clientError: ClientError) {
    super(clientError.message);
    this.name = 'GQLError';
    this.response = clientError.response;
    this.request = clientError.request;
    if (typeof clientError.response.error === 'string') {
      this.isTextBody = true;
      this.errorText = clientError.response.error;
    } else {
      this.errorText = clientError.response.errors?.map(e => e.message).join('</br>') || 'unknown error';
      const firstError = clientError.response.errors && clientError.response.errors[0];
      this.errorCode = firstError?.extensions?.webErrorCode;
    }
  }

  hasDetails(): boolean {
    return this.response.errors?.some(error => !!error.extensions) || false;
  }
}
