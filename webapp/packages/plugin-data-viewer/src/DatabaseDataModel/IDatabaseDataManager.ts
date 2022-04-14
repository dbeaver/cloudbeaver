/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { IResultSetElementKey } from './Actions/ResultSet/IResultSetDataKey';

export interface IDatabaseDataManager {
  activeElement: IResultSetElementKey | null;
  canDownload: (element: IResultSetElementKey, resultIndex: number) => boolean;
  getFileDataUrl: (element: IResultSetElementKey, resultIndex: number) => Promise<string>;
  resolveFileDataUrl: (element: IResultSetElementKey, resultIndex: number) => Promise<string>;
  retrieveFileDataUrlFromCache: (element: IResultSetElementKey, resultIndex: number) => string | undefined;
  downloadFileData: (element: IResultSetElementKey, resultIndex: number) => Promise<void>;
  clearCache: () => void;
}