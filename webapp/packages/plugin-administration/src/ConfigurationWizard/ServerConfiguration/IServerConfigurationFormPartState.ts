/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { schema } from '@cloudbeaver/core-utils';

const ServerConfigurationFormPartStateConfigSchema = schema.object({
  adminCredentialsSaveEnabled: schema.boolean().optional(),
  adminName: schema.string().optional(),
  adminPassword: schema.string().optional(),
  adminPasswordRepeat: schema.string().optional(),
  anonymousAccessEnabled: schema.boolean().optional(),
  authenticationEnabled: schema.boolean().optional(),
  customConnectionsEnabled: schema.boolean().optional(),
  disabledDrivers: schema.array(schema.string()).optional(),
  enabledAuthProviders: schema.array(schema.string()).optional(),
  enabledFeatures: schema.array(schema.string()).optional(),
  publicCredentialsSaveEnabled: schema.boolean().optional(),
  resourceManagerEnabled: schema.boolean().optional(),
  secretManagerEnabled: schema.boolean().optional(),
  serverName: schema.string().optional(),
  serverURL: schema.string().optional(),
  sessionExpireTime: schema.number().optional(),
  forceHttps: schema.boolean().optional(),
  supportedHosts: schema.string(),
});

const ServerConfigurationFormPartStateNavigatorSchema = schema.object({
  hideFolders: schema.boolean(),
  hideSchemas: schema.boolean(),
  hideVirtualModel: schema.boolean(),
  mergeEntities: schema.boolean(),
  showOnlyEntities: schema.boolean(),
  showSystemObjects: schema.boolean(),
  showUtilityObjects: schema.boolean(),
});

export type IServerConfig = schema.infer<typeof ServerConfigurationFormPartStateConfigSchema>;
export type INavigatorConfig = schema.infer<typeof ServerConfigurationFormPartStateNavigatorSchema>;

export type IServerConfigurationFormPartState = {
  serverConfig: IServerConfig;
  navigatorConfig: INavigatorConfig;
};
