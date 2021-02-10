/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { DetailsError } from './DetailsError';

export interface IErrorDetails {
  name: string;
  message: string;
  hasDetails: boolean;
}

export function hasDetails(error: Error): error is DetailsError {
  return error instanceof DetailsError && error.hasDetails();
}

export function getErrorDetails(error: Error | DetailsError): IErrorDetails {
  const exceptionMessage = hasDetails(error) ? error.errorMessage : error.message || error.name;
  return {
    name: error.name,
    message: exceptionMessage,
    hasDetails: hasDetails(error),
  };
}
