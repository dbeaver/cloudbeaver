/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { GlobalConstants } from '@cloudbeaver/core-utils';

import type { CustomGraphQLClient, UploadProgressEvent } from '../CustomGraphQLClient';

export interface IResultSetUploadingBlob {
  data: Array<any>;
  index: number;
  blob: Blob;
}

export interface IUploadDriverLibraryExtension {
  uploadBlobResultSet: (
    projectId: string,
    connectionId: string,
    contextId: string,
    resultsId: string,

    data: IResultSetUploadingBlob,
    onUploadProgress?: (event: UploadProgressEvent) => void,
  ) => Promise<void>;
}

export function uploadBlobResultSetExtension(client: CustomGraphQLClient): IUploadDriverLibraryExtension {
  return {
    uploadBlobResultSet(
      projectId: string,
      connectionId: string,
      contextId: string,
      resultsId: string,

      data: IResultSetUploadingBlob,
      onUploadProgress?: (event: UploadProgressEvent) => void,
    ): Promise<void> {
      const ds = new DataTransfer();
      if (data.blob instanceof File) {
        ds.items.add(data.blob);
      } else {
        ds.items.add(new File([data.blob], 'file'));
      }

      // api/resultset/blob
      return client.uploadFile(
        GlobalConstants.absoluteServiceUrl('resultset', 'blob'),
        ds.files,
        undefined,
        { projectId, connectionId, contextId, resultsId, data: data.data, index: data.index },
        onUploadProgress,
      );
    },
  };
}
