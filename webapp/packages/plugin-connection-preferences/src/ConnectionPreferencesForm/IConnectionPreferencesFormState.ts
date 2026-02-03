/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { schema } from '@cloudbeaver/core-utils';
import type { IFormProps } from '@cloudbeaver/core-ui';

export const CONNECTION_PREFERENCES_FORM_STATE_SCHEMA = schema
  .object({
    projectId: schema.string(),
    connectionId: schema.string(),
  })
  .strict();

export type IConnectionPreferencesFormState = schema.infer<typeof CONNECTION_PREFERENCES_FORM_STATE_SCHEMA>;
export type IConnectionPreferencesFormProps = IFormProps<IConnectionPreferencesFormState>;
