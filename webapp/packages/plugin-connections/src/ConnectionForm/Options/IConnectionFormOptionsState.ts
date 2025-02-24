/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { DriverConfigurationType, NetworkHandlerAuthType } from '@cloudbeaver/core-sdk';
import { schema } from '@cloudbeaver/core-utils';

const networkHandler = schema.object({
  id: schema.string(),
  authType: schema.enum([NetworkHandlerAuthType.Agent, NetworkHandlerAuthType.Password, NetworkHandlerAuthType.PublicKey]).optional(),
  enabled: schema.boolean().optional(),
  key: schema.string().optional(),
  password: schema.string().optional(),
  properties: schema.record(schema.any()).optional(),
  savePassword: schema.boolean().optional(),
  secureProperties: schema.record(schema.any()).optional(),
  userName: schema.string().optional(),
});

export const CONNECTION_FORM_OPTIONS_SCHEMA = schema.object({
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
  networkHandlersConfig: schema.array(networkHandler).optional(),
  port: schema.string().optional(),
  properties: schema.record(schema.any()).optional(),
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

export type IConnectionFormOptionsState = schema.infer<typeof CONNECTION_FORM_OPTIONS_SCHEMA>;
