/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { schema } from '@cloudbeaver/core-utils';

export const CONNECTION_FORM_DRIVER_PROPERTIES_SCHEMA = schema.object({
  properties: schema.record(schema.string(), schema.string().optional()),
});

export type IConnectionFromDriverPropertiesState = schema.infer<typeof CONNECTION_FORM_DRIVER_PROPERTIES_SCHEMA>;
