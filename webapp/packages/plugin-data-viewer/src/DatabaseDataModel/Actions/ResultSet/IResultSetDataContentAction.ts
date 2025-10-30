/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { IGridDataKey } from '../Grid/IGridDataKey.js';

export interface IResultSetDataContentAction {
  isLoading: (element: IGridDataKey) => boolean;
  isBlobTruncated: (element: IGridDataKey) => boolean;
  isTextTruncated: (element: IGridDataKey) => boolean;
  isDownloadable: (element: IGridDataKey) => boolean;
  resolveFileDataUrl: (element: IGridDataKey) => Promise<Blob>;
  retrieveBlobFromCache: (element: IGridDataKey) => Blob | undefined;
  downloadFileData: (element: IGridDataKey) => Promise<void>;
  clearCache: () => void;
}
