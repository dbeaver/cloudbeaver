/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { GlobalConstants } from '@cloudbeaver/core-utils';

import type { CustomGraphQLClient, UploadProgressEvent } from '../CustomGraphQLClient';

export interface IUploadDriverLibraryExtension {
  uploadDriverLibrary: (
    driverId: string,
    files: FileList,
    onUploadProgress?: (event: UploadProgressEvent) => void
  ) => Promise<void>;
}

export function uploadDriverLibraryExtension(client: CustomGraphQLClient): IUploadDriverLibraryExtension {
  return {
    uploadDriverLibrary(
      driverId: string,
      files: FileList,
      onUploadProgress?: (event: UploadProgressEvent) => void
    ): Promise<void> {

      return client.uploadFile(
        GlobalConstants.absoluteServiceUrl('drivers', 'library'),
        files,
        undefined,
        { driverId },
        onUploadProgress
      );
    },
  };
}