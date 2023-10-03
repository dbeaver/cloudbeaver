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
  uploadBlobResultSet: (fileId: string, data: Blob, onUploadProgress?: (event: UploadProgressEvent) => void) => Promise<void>;
}

export function uploadBlobResultSetExtension(client: CustomGraphQLClient): IUploadDriverLibraryExtension {
  return {
    uploadBlobResultSet(fileId: string, data: Blob, onUploadProgress?: (event: UploadProgressEvent) => void): Promise<void> {
      const ds = new DataTransfer();
      if (data instanceof File) {
        ds.items.add(data);
      } else {
        ds.items.add(new File([data], 'file'));
      }

      // api/resultset/blob
      return client.uploadFile(GlobalConstants.absoluteServiceUrl('resultset', 'blob'), ds.files, undefined, { fileId }, onUploadProgress);
    },
  };
}
