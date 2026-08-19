/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { schema } from '@cloudbeaver/core-utils';

export const AIProfileModelsSchema = schema.object({
  models: schema.array(schema.any()),
});

export type IAIProfileModelsState = schema.infer<typeof AIProfileModelsSchema>;
