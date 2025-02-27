/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { schema } from '@cloudbeaver/core-utils';

const CONNECTION_FORM_ACCESS_SCHEMA = schema.object({
  grantedSubjects: schema.array(schema.string()),
  editing: schema.boolean(),
});

export type IConnectionFormAccessState = schema.infer<typeof CONNECTION_FORM_ACCESS_SCHEMA>;
