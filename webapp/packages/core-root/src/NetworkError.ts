/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { DetailsError, GQLError, PlainGQLError } from '@cloudbeaver/core-sdk';
import { errorOf } from '@cloudbeaver/core-utils';

/**
 * Checks if an error is a network-related fetch failure.
 * Different browsers throw different error messages for network issues:
 * - Chrome/Edge: "Failed to fetch"
 * - Firefox: "NetworkError when attempting to fetch resource"
 * - Safari: "Load failed"
 */
export function isNetworkFetchError(error: unknown): error is NetworkError {
  if (!(error instanceof TypeError)) {
    return false;
  }

  const message = error.message.toLowerCase();
  const gqlError = errorOf(error, GQLError) ?? errorOf(error, PlainGQLError);
  /* 
    GraphQL always returns a 200 status code, regardless of success or failure.
    The client app proxy (e.g. vite) returns a 500 status code only in dev mode (frontend build),
    In prod mode it throws a network error with a specific message.
  */
  const isGqlProxyError = gqlError?.response.status === 500 && (!gqlError.response.body || Object.keys(gqlError.response.body).length === 0);
  /*
    fetch() API throws a TypeError when a network error occurs.
    Different browsers use different error messages (Chrome: "Failed to fetch", Firefox: "NetworkError...", Safari: "Load failed").
    This is a common way to detect network issues in web applications in prod mode (not dev frontend build)
  */
  const isCommonNetworkError =
    message.includes('failed to fetch') || // Chrome/Edge
    message.includes('networkerror') || // Firefox
    message.includes('load failed'); // Safari

  return isGqlProxyError || isCommonNetworkError;
}

export class NetworkError extends DetailsError {
  constructor(message?: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'Network Error';
  }
}
