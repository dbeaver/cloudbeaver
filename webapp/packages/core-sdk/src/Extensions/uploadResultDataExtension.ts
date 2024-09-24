/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { GlobalConstants } from '@cloudbeaver/core-utils';

import type { CustomGraphQLClient, UploadProgressEvent } from '../CustomGraphQLClient.js';
import type { AsyncTaskInfo } from '../sdk.js';

export interface IUploadResultDataExtension {
  uploadResultData: (
    connectionId: string,
    contextId: string,
    projectId: string,
    resultsId: string,
    processorId: string,
    file: File,
    onUploadProgress?: (event: UploadProgressEvent) => void,
    signal?: AbortSignal,
  ) => Promise<AsyncTaskInfo>;
}

export function uploadResultDataExtension(client: CustomGraphQLClient): IUploadResultDataExtension {
  return {
    uploadResultData(
      connectionId: string,
      contextId: string,
      projectId: string,
      resultsId: string,
      processorId: string,
      file: File,
      onUploadProgress?: (event: UploadProgressEvent) => void,
      signal?: AbortSignal,
    ): Promise<AsyncTaskInfo> {
      return client.uploadFile(
        GlobalConstants.absoluteServiceUrl('data', 'import'),
        file,
        undefined,
        { connectionId, contextId, projectId, resultsId, processorId },
        onUploadProgress,
        signal,
      );
    },
  };
}
