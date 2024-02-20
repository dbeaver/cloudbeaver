/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { schema } from '@cloudbeaver/core-utils';

export const CONNECTION_INFO_PARAM_SCHEMA = schema
  .object({
    projectId: schema.string(),
    connectionId: schema.string(),
  })
  .required()
  .strict();

export type IConnectionInfoParams = schema.infer<typeof CONNECTION_INFO_PARAM_SCHEMA>;
