/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { schema } from '@cloudbeaver/core-utils';
import { CONNECTION_NETWORK_HANDLER_SCHEMA } from '../Options/IConnectionNetworkHanler.js';

export const CONNECTION_FORM_SSH_SCHEMA = schema.object({}).extend(CONNECTION_NETWORK_HANDLER_SCHEMA.shape);

export type IConnectionFromSSHState = schema.infer<typeof CONNECTION_FORM_SSH_SCHEMA>;
