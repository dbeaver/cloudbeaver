/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { rest } from 'msw';

// TODO: use new msw API https://github.com/mswjs/msw/issues/156
export function createWebsocketEndpoint(): ReturnType<typeof rest.get> {
  return rest.get('http://localhost/api/ws', (req, res, ctx) => res(ctx.status(404)));
}
