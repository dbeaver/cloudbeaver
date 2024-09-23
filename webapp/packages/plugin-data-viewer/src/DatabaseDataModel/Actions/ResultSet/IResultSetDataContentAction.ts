/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { IResultSetElementKey } from './IResultSetDataKey.js';

export interface IResultSetDataContentAction {
  isLoading: (element: IResultSetElementKey) => boolean;
  isBlobTruncated: (element: IResultSetElementKey) => boolean;
  isTextTruncated: (element: IResultSetElementKey) => boolean;
  isDownloadable: (element: IResultSetElementKey) => boolean;
  resolveFileDataUrl: (element: IResultSetElementKey) => Promise<Blob>;
  retrieveBlobFromCache: (element: IResultSetElementKey) => Blob | undefined;
  downloadFileData: (element: IResultSetElementKey) => Promise<void>;
  clearCache: () => void;
}
