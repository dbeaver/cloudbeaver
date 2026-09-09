/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { DriverConfigurationType, DriverPropertyInfoFragment } from '@cloudbeaver/core-sdk';

export function isProviderPropertySupported(property: DriverPropertyInfoFragment, configurationType: DriverConfigurationType): boolean {
  return property.supportedConfigurationTypes?.includes(configurationType) === true;
}
