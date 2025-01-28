/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { schema } from '@cloudbeaver/core-utils';

const GRANTED_USER_STATE = schema.object({
  userId: schema.string(),
  teamRole: schema.string().nullable(),
});

const GRANTED_USERS_STATE = schema.object({
  grantedUsers: schema.array(GRANTED_USER_STATE),
});

export type IGrantedUsersState = schema.infer<typeof GRANTED_USERS_STATE>;
