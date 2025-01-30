/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { schema } from '@cloudbeaver/core-utils';

export const TEAM_GRANTED_CONNECTIONS_SCHEMA = schema.object({
  grantedSubjects: schema.array(schema.string()),
});

export type IGrantedConnectionsState = schema.infer<typeof TEAM_GRANTED_CONNECTIONS_SCHEMA>;
