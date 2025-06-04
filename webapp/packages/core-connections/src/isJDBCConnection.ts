/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { DBDriver } from './DBDriverResource.js';
import type { ConnectionInfoCustomOptions } from './ConnectionInfoCustomOptionsResource.js';

export function isJDBCConnection(driver?: DBDriver, connection?: ConnectionInfoCustomOptions): boolean {
  return connection?.useUrl || !driver?.sampleURL || false;
}
