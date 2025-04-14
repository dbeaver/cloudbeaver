/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { DriverConfigurationType } from '@cloudbeaver/core-sdk';
import { schema } from '@cloudbeaver/core-utils';
import { CONNECTION_NETWORK_HANDLER_SCHEMA } from './IConnectionNetworkHanler.js';

export const CONNECTION_PROPERTIES_SCHEMA = schema.record(schema.any());

export const CONNECTION_CONFIG_SCHEMA = schema.object({
  authModelId: schema.string().optional(),
  autocommit: schema.boolean().optional(),
  configurationType: schema.enum([DriverConfigurationType.Manual, DriverConfigurationType.Url]).optional(),
  connectionId: schema.string().optional(),
  credentials: schema.record(schema.any()).optional(),
  dataSourceId: schema.string().optional(),
  databaseName: schema.string().optional(),
  description: schema.string().optional(),
  driverId: schema.string().optional(),
  folder: schema.string().optional(),
  host: schema.string().optional(),
  keepAliveInterval: schema.number().optional(),
  mainPropertyValues: schema.record(schema.any()).optional(),
  name: schema.string().optional(),
  networkHandlersConfig: schema.array(CONNECTION_NETWORK_HANDLER_SCHEMA).optional(),
  port: schema.string().optional(),
  properties: CONNECTION_PROPERTIES_SCHEMA.optional(),
  providerProperties: schema.record(schema.any()).optional(),
  readOnly: schema.boolean().optional(),
  saveCredentials: schema.boolean().optional(),
  selectedSecretId: schema.string().optional(),
  serverName: schema.string().optional(),
  sharedCredentials: schema.boolean().optional(),
  template: schema.boolean().optional(),
  templateId: schema.string().optional(),
  url: schema.string().optional(),
  userName: schema.string().optional(),
  userPassword: schema.string().optional(),
});

export type IConnectionProperties = schema.infer<typeof CONNECTION_PROPERTIES_SCHEMA>;
