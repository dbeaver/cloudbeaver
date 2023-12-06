/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { defaultServerConfig } from '../data/defaultServerConfig';
import { HttpResponse } from 'msw';

export function mockServerConfig(productConfiguration?: Record<string, any>) {
  return function mockServerConfig() {
    return HttpResponse.json({ data: defaultServerConfig(productConfiguration) });
  };
}
