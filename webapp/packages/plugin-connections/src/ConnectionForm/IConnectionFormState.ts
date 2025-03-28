/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { schema } from '@cloudbeaver/core-utils';
import type { IFormProps } from '@cloudbeaver/core-ui';

export const CONNECTION_FORM_STATE_SCHEMA = schema
  .object({
    projectId: schema.string(),
    availableDrivers: schema.array(schema.string()),
    requiredNetworkHandlersIds: schema.array(schema.string()),
    connectionId: schema.string().or(schema.undefined()),
    type: schema.enum(['admin', 'public']),
  })
  .required()
  .strict();

export type IConnectionFormState = schema.infer<typeof CONNECTION_FORM_STATE_SCHEMA>;
export type IConnectionFormProps = IFormProps<IConnectionFormState>;
