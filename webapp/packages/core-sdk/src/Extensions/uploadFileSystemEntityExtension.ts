/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { GlobalConstants } from '@cloudbeaver/core-utils';

import type { CustomGraphQLClient, UploadProgressEvent } from '../CustomGraphQLClient';

export interface IUploadFileSystemEntityExtension {
  uploadFileSystemEntity: (
    parentURI: string,
    projectId: string,
    files: FileList,
    onUploadProgress?: (event: UploadProgressEvent) => void,
  ) => Promise<void>;
}

export function uploadFileSystemEntityExtension(client: CustomGraphQLClient): IUploadFileSystemEntityExtension {
  return {
    uploadFileSystemEntity(
      parentURI: string,
      projectId: string,
      files: FileList,
      onUploadProgress?: (event: UploadProgressEvent) => void,
    ): Promise<void> {
      return client.uploadFiles(GlobalConstants.absoluteServiceUrl('fs-data'), files, undefined, { parentURI, projectId }, onUploadProgress);
    },
  };
}
