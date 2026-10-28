/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { DBDriver } from '@cloudbeaver/core-connections';
import type { DriverConfigurationType, DriverPropertyInfoFragment } from '@cloudbeaver/core-sdk';

import { isProviderPropertySupported } from './AdvancedSettings/isProviderPropertySupported.js';

type ProviderPropertiesDriver = Pick<DBDriver, 'providerId' | 'providerProperties'>;

function isMainProviderProperty(driver: ProviderPropertiesDriver, property: DriverPropertyInfoFragment): boolean {
  return driver.providerId === 'influxdb2' && property.id === 'influx.org';
}

export function getMainProviderProperties(
  driver: ProviderPropertiesDriver | undefined,
  configurationType: DriverConfigurationType | undefined,
): DriverPropertyInfoFragment[] {
  if (!driver || !configurationType) {
    return [];
  }

  return (driver.providerProperties ?? [])
    .filter(property => isMainProviderProperty(driver, property) && isProviderPropertySupported(property, configurationType))
    .map(property => ({ ...property, required: true }));
}

export function getAdvancedProviderProperties(
  driver: ProviderPropertiesDriver | undefined,
  configurationType: DriverConfigurationType | undefined,
): DriverPropertyInfoFragment[] {
  if (!driver || !configurationType) {
    return [];
  }

  return (driver.providerProperties ?? []).filter(
    property => !isMainProviderProperty(driver, property) && isProviderPropertySupported(property, configurationType),
  );
}

export function hasMissingMainProviderProperties(
  properties: readonly DriverPropertyInfoFragment[],
  values: Record<string, unknown> | undefined,
): boolean {
  return properties.some(property => {
    if (!property.required || !property.id) {
      return false;
    }

    const value = values?.[property.id];
    return typeof value !== 'string' || value.trim().length === 0;
  });
}
