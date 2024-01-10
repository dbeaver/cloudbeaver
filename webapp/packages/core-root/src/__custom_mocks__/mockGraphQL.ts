/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { GraphQLHandler } from 'msw';
import { setupServer } from 'msw/node';

import { createWebsocketEndpoint } from './createWebsocketEndpoint';

export function mockGraphQL(...requestHandlers: GraphQLHandler[]) {
  const server = setupServer(...requestHandlers, createWebsocketEndpoint());

  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  return server;
}
