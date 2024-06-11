/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { DBDriver } from '@cloudbeaver/core-connections';
import { DriverConfigurationType } from '@cloudbeaver/core-sdk';

export function getDefaultConfigurationType(driver: DBDriver) {
  const isCustomConfiguration = driver?.configurationTypes.includes(DriverConfigurationType.Custom) && driver.mainProperties.length > 0;
  const isManualConfiguration = driver?.configurationTypes.includes(DriverConfigurationType.Manual);

  if (isCustomConfiguration) {
    return DriverConfigurationType.Custom;
  }

  return isManualConfiguration ? DriverConfigurationType.Manual : DriverConfigurationType.Url;
}
