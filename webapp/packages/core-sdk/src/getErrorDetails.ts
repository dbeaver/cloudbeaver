/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { DetailsError } from './DetailsError';
import { ServerErrorType, ServerInternalError } from './ServerInternalError';

export interface IErrorDetails {
  name: string;
  message: string;
  hasDetails: boolean;
  errorType?: ServerErrorType;
}

export function hasDetails(error: Error | undefined | null): error is DetailsError {
  return error instanceof DetailsError && error.hasDetails();
}

export function getErrorDetails(error: Error | DetailsError | undefined | null): IErrorDetails {
  const exceptionMessage = (hasDetails(error) ? error.errorMessage : error?.message) || error?.name || 'Unknown error';

  const details: IErrorDetails = {
    name: error?.name ?? 'Error',
    message: exceptionMessage,
    hasDetails: hasDetails(error),
  };

  if (error instanceof ServerInternalError && error.errorType) {
    details.errorType = error.errorType;
    if (error.errorType === ServerErrorType.QUOTE_EXCEEDED) {
      details.hasDetails = false;
    }
  }

  return details;
}
