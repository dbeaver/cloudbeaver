/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { GraphQLVariables, HttpResponse } from 'msw';

export function mockOpenSession(variables: GraphQLVariables) {
  const date = new Date().toISOString();
  return HttpResponse.json({
    data: {
      session: {
        valid: true,
        remainingTime: 0,
        createTime: date,
        lastAccessTime: date,
        cacheExpired: false,
        locale: variables.defaultLocale ?? 'en',
        actionParameters: null,
      },
    },
});
}
