/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { schema } from '@cloudbeaver/core-utils';

export const USER_FORM_INFO_PART_SCHEMA = schema.object({
  userId: schema.string().trim(),
  enabled: schema.boolean(),
  password: schema.string().trim(),
  metaParameters: schema.record(schema.string(), schema.string().trim().or(schema.any())),
  teams: schema.array(schema.string()),
  authRole: schema.string(),
});

export type IUserFormInfoState = schema.infer<typeof USER_FORM_INFO_PART_SCHEMA>;
