/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { ClientError } from 'graphql-request';

import { getTextBetween } from '@cloudbeaver/core-utils';

import { DetailsError } from './DetailsError.js';

export class PlainGQLError extends DetailsError {
  response: ClientError['response'];
  request: ClientError['request'];
  constructor(clientError: ClientError) {
    let message = clientError.message;

    if (typeof clientError.response['error'] === 'string') {
      message = getTextBetween(clientError.response['error'], '<title>', '</title>');
    }

    super(message, { cause: clientError });
    this.name = 'GQL Error';
    this.response = clientError.response;
    this.request = clientError.request;
  }

  override hasDetails(): boolean {
    return false;
  }
}
