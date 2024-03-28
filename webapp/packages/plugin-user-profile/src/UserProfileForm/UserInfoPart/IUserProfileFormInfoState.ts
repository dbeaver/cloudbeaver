/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { schema } from '@cloudbeaver/core-utils';

export const USER_PROFILE_FORM_INFO_PART_STATE_SCHEMA = schema
  .object({
    userId: schema.string(),
    displayName: schema.string().trim(),
    authRole: schema.string().optional(),
    metaParameters: schema.record(schema.union([schema.string().trim(), schema.any()])).optional(),
  })
  .required();

export type IUserProfileFormInfoState = schema.infer<typeof USER_PROFILE_FORM_INFO_PART_STATE_SCHEMA>;
