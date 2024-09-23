/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { graphql } from 'msw';

import { mockOpenSession } from './resolvers/mockOpenSession.js';
import { mockServerConfig } from './resolvers/mockServerConfig.js';

export function mockAppInit(endpoint: ReturnType<typeof graphql.link>, productConfiguration?: Record<string, any>) {
  return [endpoint.query('serverConfig', mockServerConfig(productConfiguration)), endpoint.mutation('openSession', mockOpenSession)];
}
