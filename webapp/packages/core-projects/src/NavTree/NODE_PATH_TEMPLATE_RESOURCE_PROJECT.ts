/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { createPathParamTemplate, createPathTemplate } from '@cloudbeaver/core-utils';

export const NODE_PATH_TEMPLATE_RESOURCE_PROJECT = createPathTemplate(createPathParamTemplate('projectId', 'project'));
