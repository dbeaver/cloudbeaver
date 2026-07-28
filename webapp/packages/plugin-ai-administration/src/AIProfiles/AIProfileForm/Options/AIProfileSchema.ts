/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { schema } from '@cloudbeaver/core-utils';

export const AI_PROFILE_NAME_MIN_LENGTH = 1;
export const AI_PROFILE_NAME_MAX_LENGTH = 100;

export const AIProfileSchema = schema.object({
  name: schema.string().min(AI_PROFILE_NAME_MIN_LENGTH).max(AI_PROFILE_NAME_MAX_LENGTH),
  engineId: schema.string().min(1),
  properties: schema.record(schema.string(), schema.any()),
});

export type IAIProfileOptionsState = schema.infer<typeof AIProfileSchema>;
