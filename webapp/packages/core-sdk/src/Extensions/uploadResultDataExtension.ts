/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { GlobalConstants } from '@cloudbeaver/core-utils';

import type { CustomGraphQLClient, UploadProgressEvent } from '../CustomGraphQLClient';

export interface IUploadResultDataExtension {
  uploadResultData: (
    connectionId: string,
    contextId: string,
    projectId: string,
    resultsId: string,
    files: FileList,
    onUploadProgress?: (event: UploadProgressEvent) => void,
  ) => Promise<void>;
}

export function uploadResultDataExtension(client: CustomGraphQLClient): IUploadResultDataExtension {
  return {
    uploadResultData(
      connectionId: string,
      contextId: string,
      projectId: string,
      resultsId: string,
      files: FileList,
      onUploadProgress?: (event: UploadProgressEvent) => void,
    ): Promise<void> {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          const success = Math.random() > 0.5;
          if (success) {
            resolve();
          } else {
            reject(new Error('Upload failed'));
          }
        }, 1200);
      });
    },
  };
}
