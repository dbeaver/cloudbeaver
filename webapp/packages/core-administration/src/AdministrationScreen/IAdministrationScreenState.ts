/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { schema } from '@cloudbeaver/core-utils';

export const ADMINISTRATION_SCREEN_STATE_SCHEMA = schema.object({
  workspaceId: schema.string(),
  version: schema.string(),
  serverVersion: schema.string(),
  configurationMode: schema.boolean(),
  itemsState: schema.array(schema.tuple([schema.string(), schema.any()])),
});

export type IAdministrationScreenInfo = schema.infer<typeof ADMINISTRATION_SCREEN_STATE_SCHEMA>;
