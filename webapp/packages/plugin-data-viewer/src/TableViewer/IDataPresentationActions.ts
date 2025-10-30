/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { IGridColumnKey } from '../DatabaseDataModel/Actions/Grid/IGridDataKey.js';

export interface IDataPresentationActions {
  edit: () => void;
  pinColumn: (key: IGridColumnKey) => void;
  unpinColumn: (key: IGridColumnKey) => void;
  isPinnedColumn: (key: IGridColumnKey) => boolean;
}
