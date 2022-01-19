/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { DatabaseConnection } from './DatabaseConnection';
import type { DBDriver } from './DBDriverResource';

export function isJDBCConnection(driver?: DBDriver, connection?: DatabaseConnection): boolean {
  return connection?.useUrl || !driver?.sampleURL || false;
}
