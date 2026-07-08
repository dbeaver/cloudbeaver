/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useService } from '@cloudbeaver/core-di';

import type { IConnectionInfoParams } from '../CONNECTION_INFO_PARAM_SCHEMA.js';
import { ConnectionTypeService } from './ConnectionTypeService.js';

export function useConnectionTypeColor(connectionKey: IConnectionInfoParams | undefined): string | undefined {
  const connectionTypeService = useService(ConnectionTypeService);

  if (!connectionKey) {
    return;
  }

  return connectionTypeService.getConnectionTypeColor(connectionKey);
}
