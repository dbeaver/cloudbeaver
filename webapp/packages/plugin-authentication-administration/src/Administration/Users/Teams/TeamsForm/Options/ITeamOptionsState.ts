/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { RecordKeySchema, schema } from '@cloudbeaver/core-utils';

const TEAM_OPTIONS_STATE = schema.object({
  teamId: schema.string(),
  teamName: schema.string(),
  teamPermissions: schema.array(schema.string()),
  description: schema.string(),
  metaParameters: schema.record(RecordKeySchema, schema.any()),
});

export type ITeamOptionsState = schema.infer<typeof TEAM_OPTIONS_STATE>;
