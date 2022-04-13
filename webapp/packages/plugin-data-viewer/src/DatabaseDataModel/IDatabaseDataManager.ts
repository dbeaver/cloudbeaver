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
  canGetFileURLFor: (element: IResultSetElementKey, resultIndex: number) => boolean;
  getFileURLFor: (element: IResultSetElementKey, resultIndex: number) => Promise<string>;
  resolveFileURLFor: (element: IResultSetElementKey, resultIndex: number) => Promise<string>;
  downloadFileFor: (element: IResultSetElementKey, resultIndex: number) => Promise<void>;
  retrieveFileURLFromCacheFor: (element: IResultSetElementKey, resultIndex: number) => string | undefined;
  clearCache: () => void;
}