/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useCaptureViewContext } from '@cloudbeaver/core-view';

import { DATA_CONTEXT_RESOURCE_MANAGER_TREE_RESOURCE_TYPE_ID } from './DATA_CONTEXT_RESOURCE_MANAGER_TREE_RESOURCE_TYPE_ID';

interface Props {
  resourceTypeId?: string;
}

export const ResourceManagerTreeCaptureViewContext: React.FC<Props> = function ResourceManagerTreeCaptureViewContext({
  resourceTypeId,
}) {
  useCaptureViewContext(context => {
    context?.set(DATA_CONTEXT_RESOURCE_MANAGER_TREE_RESOURCE_TYPE_ID, resourceTypeId);
  });

  return null;
};