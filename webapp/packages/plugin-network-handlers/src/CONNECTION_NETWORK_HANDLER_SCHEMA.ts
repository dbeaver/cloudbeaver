/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { NetworkHandlerAuthType } from '@cloudbeaver/core-sdk';
import { schema } from '@cloudbeaver/core-utils';

const nullToUndefined = <T>(val: T) => (val === null ? undefined : val);

export const NETWORK_HANDLER_SCHEMA = schema.object({
  id: schema.string(),
  authType: schema.preprocess(nullToUndefined, schema.nativeEnum(NetworkHandlerAuthType).optional()),
  enabled: schema.preprocess(nullToUndefined, schema.boolean().optional()),
  key: schema.preprocess(nullToUndefined, schema.string().optional()),
  password: schema.preprocess(nullToUndefined, schema.string().optional()),
  properties: schema.preprocess(nullToUndefined, schema.record(schema.string(), schema.any()).optional()),
  savePassword: schema.preprocess(nullToUndefined, schema.boolean().optional()),
  secureProperties: schema.preprocess(nullToUndefined, schema.record(schema.string(), schema.any()).optional()),
  userName: schema.preprocess(nullToUndefined, schema.string().optional()),
});

export type INetworkHandlerConfig = schema.infer<typeof NETWORK_HANDLER_SCHEMA>;
