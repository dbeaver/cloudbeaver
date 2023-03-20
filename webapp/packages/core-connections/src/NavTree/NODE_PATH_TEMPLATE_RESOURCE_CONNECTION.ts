/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { createPathTemplate } from '@cloudbeaver/core-utils';

import { CONNECTION_ID_TEMPLATE } from './CONNECTION_ID_TEMPLATE';
import { NODE_PATH_TEMPLATE_CONNECTIONS } from './NODE_PATH_TEMPLATE_CONNECTIONS';

export const NODE_PATH_TEMPLATE_RESOURCE_CONNECTION = createPathTemplate(
  NODE_PATH_TEMPLATE_CONNECTIONS,
  CONNECTION_ID_TEMPLATE
);

