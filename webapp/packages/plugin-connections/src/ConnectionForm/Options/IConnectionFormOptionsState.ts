/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { schema } from '@cloudbeaver/core-utils';
import { CONNECTION_CONFIG_SCHEMA } from './IConnectionConfig.js';

export const CONNECTION_FORM_OPTIONS_SCHEMA = CONNECTION_CONFIG_SCHEMA.extend({});

export type IConnectionFormOptionsState = schema.infer<typeof CONNECTION_FORM_OPTIONS_SCHEMA>;
