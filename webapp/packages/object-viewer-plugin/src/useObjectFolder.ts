/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useService } from '@dbeaver/core/di';

import { ObjectViewerService } from './ObjectViewerService';

export function useObjectFolder(objectId: string, folderId: string) {
  const objectViewerService = useService(ObjectViewerService);

  const isLoading = objectViewerService.isTabLoading(`${objectId}_${folderId}`);

  return { isLoading };
}
