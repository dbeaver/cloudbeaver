/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { NetworkHandlerAuthType } from '@cloudbeaver/core-sdk';
import { schema } from '@cloudbeaver/core-utils';

export const CONNECTION_NETWORK_HANDLER_SCHEMA = schema.object({
  id: schema.string(),
  authType: schema.nativeEnum(NetworkHandlerAuthType).optional(),
  enabled: schema.boolean().optional(),
  key: schema.string().optional(),
  password: schema.string().optional(),
  properties: schema.record(schema.any()).optional(),
  savePassword: schema.boolean().optional(),
  secureProperties: schema.record(schema.any()).optional(),
  userName: schema.string().optional(),
});

export type INetworkHandlerConfig = schema.infer<typeof CONNECTION_NETWORK_HANDLER_SCHEMA>;
