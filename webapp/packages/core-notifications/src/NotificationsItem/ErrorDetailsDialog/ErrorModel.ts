/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { GQLError, ServerInternalError } from '@cloudbeaver/core-sdk';

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
    this.reason = reason || '';
    // text error
    if (!error) {
      this.textToCopy = this.reason;
    } else if (error instanceof GQLError) { // GQL Error
      this.errors = (error.response?.errors || [])
        .map(error => {
          const errorInfo: IErrorInfo = {
            message: error.message,
            stackTrace: error.extensions?.stackTrace || '',
          };
          return errorInfo;
        });

      this.textToCopy = error.isTextBody
        ? error.errorMessage
        : this.textToCopy = this.errors
          .map(error => `${error.message}\n${error.stackTrace}`)
          .join('------------------\n');

      if (error.isTextBody) {
        this.htmlBody = error.errorMessage;
      }
    } else if (error instanceof ServerInternalError) {
      this.errors = [
        {
          message: error.message,
          stackTrace: error.stackTrace || '',
        },
      ];
      this.textToCopy = `${error.message}\n${error.stackTrace}`;
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
