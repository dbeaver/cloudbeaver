/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { IGridDataKey } from '../Grid/IGridDataKey.js';
import type { IDatabaseValueHolder } from '../IDatabaseValueHolder.js';
import type { IResultSetValue } from './ResultSetFormatAction.js';

export interface IResultSetDataContentAction {
  isLoading: (element: IGridDataKey) => boolean;
  isBlobTruncated: (holder: IDatabaseValueHolder<IGridDataKey, IResultSetValue>) => boolean;
  isTextTruncated: (holder: IDatabaseValueHolder<IGridDataKey, IResultSetValue>) => boolean;
  isDownloadable: (holder: IDatabaseValueHolder<IGridDataKey, IResultSetValue>) => boolean;
  resolveFileDataUrl: (element: IGridDataKey) => Promise<Blob>;
  retrieveBlobFromCache: (element: IGridDataKey) => Blob | undefined;
  downloadFileData: (element: IGridDataKey) => Promise<void>;
  clearCache: () => void;
}
