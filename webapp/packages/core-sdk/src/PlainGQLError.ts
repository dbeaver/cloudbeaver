/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { ClientError } from 'graphql-request';
import type { GraphQLRequestContext, GraphQLResponse } from 'graphql-request/dist/types';

import { getTextBetween } from '@cloudbeaver/core-utils';

import { DetailsError } from './DetailsError';

export class PlainGQLError extends DetailsError {
  response: GraphQLResponse;
  request: GraphQLRequestContext;
  constructor(clientError: ClientError) {
    let message = clientError.message;

    if (typeof clientError.response.error === 'string') {
      message = getTextBetween(clientError.response.error, '<title>', '</title>');
    }

    super(message);
    this.name = 'GQL Error';
    this.response = clientError.response;
    this.request = clientError.request;
  }

  hasDetails(): boolean {
    return false;
  }
}