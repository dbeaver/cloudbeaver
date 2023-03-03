/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { errorOf } from '@cloudbeaver/core-utils';

import { DetailsError } from './DetailsError';
import { ServerErrorType, ServerInternalError } from './ServerInternalError';

export interface IErrorDetails {
  name: string;
  message: string;
  hasDetails: boolean;
  errorType?: ServerErrorType;
}

export function getErrorDetails(error: Error | DetailsError | undefined | null): IErrorDetails {
  const serverInternalError = errorOf(error, ServerInternalError);
  const detailsError = errorOf(error, DetailsError);
  const hasDetails = detailsError?.hasDetails() ?? false;
  const exceptionMessage = detailsError?.errorMessage || error?.message || error?.name || 'Unknown error';

  const details: IErrorDetails = {
    name: error?.name ?? 'Error',
    message: exceptionMessage,
    hasDetails,
  };

  if (serverInternalError?.errorType) {
    details.errorType = serverInternalError.errorType;
    if (serverInternalError.errorType === ServerErrorType.QUOTE_EXCEEDED) {
      details.hasDetails = false;
    }
  }

  return details;
}
