/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { createPathTemplate } from '@cloudbeaver/core-utils';

import { CONNECTION_ID_TEMPLATE } from './CONNECTION_ID_TEMPLATE';
import { NODE_PATH_TEMPLATE_RESOURCE_CONNECTION_FOLDER } from './NODE_PATH_TEMPLATE_RESOURCE_CONNECTION_FOLDER';

export const NODE_PATH_TEMPLATE_RESOURCE_CONNECTION_FOLDER_CONNECTION = createPathTemplate(
  NODE_PATH_TEMPLATE_RESOURCE_CONNECTION_FOLDER,
  CONNECTION_ID_TEMPLATE
);

