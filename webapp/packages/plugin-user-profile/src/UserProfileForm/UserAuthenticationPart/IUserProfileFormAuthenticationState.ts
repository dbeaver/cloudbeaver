/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { schema } from '@cloudbeaver/core-utils';

export const USER_PROFILE_FORM_AUTHENTICATION_PART_STATE_SCHEMA = schema
  .object({
    oldPassword: schema.string(),
    password: schema.string().trim(),
    repeatedPassword: schema.string(),
  })
  .required();

export type IUserProfileFormAuthenticationState = schema.infer<typeof USER_PROFILE_FORM_AUTHENTICATION_PART_STATE_SCHEMA>;
