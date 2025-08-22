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

export const CONNECTION_PROPERTIES_SCHEMA = schema.record(schema.string(), schema.any());

export const CONNECTION_CONFIG_SCHEMA = schema.object({
  authModelId: schema.string().optional(),
  autocommit: schema.boolean().optional(),
  configurationType: schema.enum([DriverConfigurationType.Manual, DriverConfigurationType.Url]).optional(),
  connectionId: schema.string().optional(),
  credentials: schema.record(schema.string(), schema.any()).optional(),
  dataSourceId: schema.string().optional(),
  databaseName: schema.string().trim().optional().nullable(),
  description: schema.string().trim().optional().nullable(),
  driverId: schema.string().optional(),
  folder: schema.string().optional(),
  host: schema.string().trim().optional(),
  keepAliveInterval: schema.number().optional(),
  defaultCatalogName: schema.string().optional().nullable(),
  defaultSchemaName: schema.string().optional().nullable(),
  mainPropertyValues: schema.record(schema.string(), schema.any()).optional(),
  name: schema.string().trim().optional(),
  networkHandlersConfig: schema.array(CONNECTION_NETWORK_HANDLER_SCHEMA).optional(),
  port: schema.string().trim().optional().nullable(),
  properties: CONNECTION_PROPERTIES_SCHEMA.optional(),
  providerProperties: schema.record(schema.string(), schema.any()).optional(),
  readOnly: schema.boolean().optional(),
  saveCredentials: schema.boolean().optional(),
  selectedSecretId: schema.string().optional(),
  serverName: schema.string().trim().optional().nullable(),
  sharedCredentials: schema.boolean().optional(),
  url: schema.string().trim().optional(),
  userName: schema.string().trim().optional(),
  userPassword: schema.string().optional(),
});

export type IConnectionProperties = schema.infer<typeof CONNECTION_PROPERTIES_SCHEMA>;
