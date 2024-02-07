/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { IResultSetElementKey } from './IResultSetDataKey';

export interface IResultSetDataContentAction {
  activeElement: IResultSetElementKey | null;
  isImageTruncated: (element: IResultSetElementKey) => boolean;
  isTextTruncated: (element: IResultSetElementKey) => boolean;
  isDownloadable: (element: IResultSetElementKey) => boolean;
  getFileDataUrl: (element: IResultSetElementKey) => Promise<string>;
  resolveFileDataUrl: (element: IResultSetElementKey) => Promise<string>;
  retrieveFileDataUrlFromCache: (element: IResultSetElementKey) => string | undefined;
  downloadFileData: (element: IResultSetElementKey) => Promise<void>;
  clearCache: () => void;
}
