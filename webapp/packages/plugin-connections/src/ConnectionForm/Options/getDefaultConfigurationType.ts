/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { DBDriver } from '@cloudbeaver/core-connections';
import { DriverConfigurationType } from '@cloudbeaver/core-sdk';

export function getDefaultConfigurationType(driver: DBDriver | undefined) {
  if (!driver) {
    return DriverConfigurationType.Url;
  }

  const supportManual = driver.configurationTypes.includes(DriverConfigurationType.Manual);
  return supportManual ? DriverConfigurationType.Manual : DriverConfigurationType.Url;
}
