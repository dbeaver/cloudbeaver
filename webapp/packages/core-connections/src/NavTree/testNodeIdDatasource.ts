/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { testPath } from '@cloudbeaver/core-utils';

import { NODE_PATH_TEMPLATE_RESOURCE_CONNECTION } from './NODE_PATH_TEMPLATE_RESOURCE_CONNECTION';
import { NODE_PATH_TEMPLATE_RESOURCE_CONNECTION_FOLDER_CONNECTION } from './NODE_PATH_TEMPLATE_RESOURCE_CONNECTION_FOLDER_CONNECTION';

export function testNodeIdDatasource(nodeId: string) {
  return (
    testPath(NODE_PATH_TEMPLATE_RESOURCE_CONNECTION_FOLDER_CONNECTION, nodeId, true)
    ?? testPath(NODE_PATH_TEMPLATE_RESOURCE_CONNECTION, nodeId, true)
  );
}