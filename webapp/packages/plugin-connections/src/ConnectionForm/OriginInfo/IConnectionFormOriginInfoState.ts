/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { schema } from '@cloudbeaver/core-utils';

const CONNECTION_FORM_ORIGIN_INFO_SCHEMA = schema.record(
  schema.string(),
  schema.object({
    id: schema.string().optional(),
    required: schema.boolean(),
    displayName: schema.string().optional(),
    description: schema.string().optional(),
    category: schema.string().optional(),
    dataType: schema.string().optional(),
    defaultValue: schema.any().optional(),
    validValues: schema.array(schema.any()).optional(),
    value: schema.any().optional(),
    length: schema.string(),
    features: schema.array(schema.string()),
    order: schema.number(),
  }),
);

export type IConnectionFormOriginInfoState = schema.infer<typeof CONNECTION_FORM_ORIGIN_INFO_SCHEMA>;
