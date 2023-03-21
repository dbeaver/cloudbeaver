/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { createPathParamTemplateSplat, createPathTemplate } from '@cloudbeaver/core-utils';

import { PATH_TEMPLATE_RM_PROJECT } from './PATH_TEMPLATE_RM_PROJECT';

export const PATH_TEMPLATE_RM_PROJECT_RESOURCE = createPathTemplate(
  PATH_TEMPLATE_RM_PROJECT,
  createPathParamTemplateSplat('resourcePath')
);