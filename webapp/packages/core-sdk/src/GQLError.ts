/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="types.d.ts" />

import type { GraphQLResponse, GraphQLRequestContext, ClientError } from 'graphql-request/dist/src/types';

import { DetailsError } from './DetailsError';

export class GQLError extends DetailsError {
  response: GraphQLResponse;
  request: GraphQLRequestContext;
  errorMessage: string;
  errorCode?: string;
  isTextBody = false; // true when server returns not GQLError object but plain text or html error

  constructor(clientError: ClientError) {
    super(clientError.message);
    this.name = 'Server Error';
    this.response = clientError.response;
    this.request = clientError.request;
    if (typeof clientError.response.error === 'string') {
      this.isTextBody = true;
      this.errorMessage = clientError.response.error;
    } else {
      this.errorMessage = clientError.response.errors?.map(e => e.message).join('\n') || 'unknown error';

      const firstError = clientError.response.errors?.[0];
      this.errorCode = firstError?.extensions?.webErrorCode;
    }
  }

  hasDetails(): boolean {
    return this.response.errors?.some(error => !!error.extensions) || false;
  }
}
