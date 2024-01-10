/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { http, HttpResponse } from 'msw';

// TODO: use new msw API https://github.com/mswjs/msw/issues/156
export function createWebsocketEndpoint(): ReturnType<typeof http.get> {
  return http.get('http://localhost/api/ws', () => new HttpResponse(null, { status: 404 }));
}
