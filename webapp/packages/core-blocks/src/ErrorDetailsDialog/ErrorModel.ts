/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { DetailsError, GQLError, type SDKGraphQLErrorExtensions } from '@cloudbeaver/core-sdk';
import { errorOf } from '@cloudbeaver/core-utils';

export interface IErrorInfo {
  message: string;
  isHtml?: boolean;
  stackTrace?: string;
}

export interface IErrorModelOptions {
  error?: Error | string;
}

export class ErrorModel {
  errors: IErrorInfo[] = [];
  get textToCopy(): string {
    return this.errors.map(error => `${error.message}\n${error.stackTrace}`).join('------------------\n');
  }

  constructor({ error }: IErrorModelOptions) {
    const gqlError = errorOf(error, GQLError);
    const detailsError = errorOf(error, DetailsError);
    // text error
    if (typeof error === 'string') {
      this.errors = [
        {
          message: error,
        },
      ];
    } else if (gqlError) {
      // GQL Error
      this.errors = (gqlError.response.errors || []).map<IErrorInfo>(error => ({
        message: error.message,
        stackTrace: (error.extensions as SDKGraphQLErrorExtensions).stackTrace || '',
      }));

      if (gqlError.isTextBody) {
        this.errors.push({
          message: gqlError.message,
          isHtml: true,
        });
      }
    } else if (detailsError) {
      this.errors = [
        {
          message: detailsError.message,
          stackTrace: detailsError.stack,
        },
      ];
    } else if (error instanceof Error) {
      this.errors = [
        {
          message: error.message,
          stackTrace: error.stack,
        },
      ];
    }
  }
}
