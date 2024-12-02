/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { errorOf } from '@cloudbeaver/core-utils';

import { GQLError } from './GQLError.js';

interface IGraphQLResponse<T> {
  data: T | null;
  error?: Error;
}

export async function getGQLResponse<T>(query: Promise<T>): Promise<IGraphQLResponse<T>> {
  try {
    const data = await query;

    return { data };
  } catch (exception: any) {
    const gqlError = errorOf(exception, GQLError);
    const data = (gqlError?.response.data || null) as T | null;
    return {
      data,
      error: exception,
    };
  }
}
