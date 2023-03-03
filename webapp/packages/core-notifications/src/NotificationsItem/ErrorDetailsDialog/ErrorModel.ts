/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { GQLError, ServerInternalError } from '@cloudbeaver/core-sdk';
import { errorOf } from '@cloudbeaver/core-utils';

export interface IErrorInfo {
  message: string;
  stackTrace: string;
}

export interface IErrorModelOptions {
  reason?: string;
  error?: Error;
}

export class ErrorModel {
  reason: string;
  errors: IErrorInfo[] = [];
  textToCopy = '';
  htmlBody = '';

  constructor({ reason, error }: IErrorModelOptions) {
    const gqlError = errorOf(error, GQLError);
    const serverInternalError = errorOf(error, ServerInternalError);
    this.reason = reason || '';
    // text error
    if (!error) {
      this.textToCopy = this.reason;
    } else if (gqlError) { // GQL Error
      this.errors = (gqlError.response.errors || [])
        .map(error => {
          const errorInfo: IErrorInfo = {
            message: error.message,
            stackTrace: error.extensions.stackTrace || '',
          };
          return errorInfo;
        });

      this.textToCopy = gqlError.isTextBody
        ? gqlError.errorMessage
        : this.textToCopy = this.errors
          .map(error => `${error.message}\n${error.stackTrace}`)
          .join('------------------\n');

      if (gqlError.isTextBody) {
        this.htmlBody = gqlError.errorMessage;
      }
    } else if (serverInternalError) {
      this.errors = [
        {
          message: serverInternalError.message,
          stackTrace: serverInternalError.stackTrace || '',
        },
      ];
      this.textToCopy = `${serverInternalError.message}\n${serverInternalError.stackTrace}`;
    } else if (error instanceof Error) { // Common Error
      this.errors = [
        {
          message: error.message,
          stackTrace: error.stack || '',
        },
      ];
      this.textToCopy = `${error.message}\n${error.stack}`;
    }
  }
}
