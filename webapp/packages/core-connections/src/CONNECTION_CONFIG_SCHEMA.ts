/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { DriverConfigurationType, NetworkHandlerAuthType } from '@cloudbeaver/core-sdk';
import { schema } from '@cloudbeaver/core-utils';

export const CONNECTION_PROPERTIES_SCHEMA = schema.record(schema.string(), schema.any());

export const CONNECTION_NETWORK_HANDLER_SCHEMA = schema.object({
  id: schema.string(),
  authType: schema.nativeEnum(NetworkHandlerAuthType).optional(),
  enabled: schema.boolean().optional(),
  key: schema.string().optional(),
  password: schema.string().optional(),
  properties: schema.record(schema.string(), schema.any()).optional(),
  savePassword: schema.boolean().optional(),
  secureProperties: schema.record(schema.string(), schema.any()).optional(),
  userName: schema.string().optional(),
});

export const CONNECTION_CONFIG_SCHEMA = schema.object({
  authModelId: schema.string().optional(),
  configurationType: schema.enum([DriverConfigurationType.Manual, DriverConfigurationType.Url]).optional(),
  connectionId: schema.string().optional(),
  credentials: schema.record(schema.string(), schema.any()).optional(),
  dataSourceId: schema.string().optional(),
  databaseName: schema.string().optional(),
  description: schema.string().optional(),
  driverId: schema.string().optional(),
  folder: schema.string().optional(),
  host: schema.string().optional(),
  mainPropertyValues: schema.record(schema.string(), schema.any()).optional(),
  expertSettingsValues: schema.record(schema.string(), schema.any()).optional(),
  name: schema.string().optional(),
  networkHandlersConfig: schema.array(CONNECTION_NETWORK_HANDLER_SCHEMA).optional(),
  port: schema.string().optional(),
  properties: CONNECTION_PROPERTIES_SCHEMA.optional(),
  providerProperties: schema.record(schema.string(), schema.any()).optional(),
  saveCredentials: schema.boolean().optional(),
  selectedSecretId: schema.string().optional(),
  serverName: schema.string().optional(),
  sharedCredentials: schema.boolean().optional(),
  url: schema.string().optional(),
  userName: schema.string().optional(),
  userPassword: schema.string().optional(),
});
