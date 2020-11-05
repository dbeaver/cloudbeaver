/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { GQLError } from './GQLError';
import { ServerInternalError } from './ServerInternalError';

export interface IErrorDetails {
  name: string;
  message: string;
  hasDetails: boolean;
}

export function hasDetails(error: Error): error is GQLError | ServerInternalError {
  return error instanceof GQLError || error instanceof ServerInternalError;
}

export function getErrorDetails(error: Error | GQLError): IErrorDetails {
  const exceptionMessage = hasDetails(error) ? error.errorText : error.message || error.name;
  return {
    name: error.name,
    message: exceptionMessage,
    hasDetails: hasDetails(error),
  };
}
