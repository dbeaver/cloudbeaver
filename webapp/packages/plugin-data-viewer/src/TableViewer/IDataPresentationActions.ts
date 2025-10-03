/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { IResultSetColumnKey } from '../DatabaseDataModel/Actions/ResultSet/IResultSetDataKey.js';

export interface IDataPresentationActions<TKey> {
  edit: (key: TKey) => void;
  pinColumn: (key: IResultSetColumnKey) => void;
  unpinColumn: (key: IResultSetColumnKey) => void;
  isPinnedColumn: (key: IResultSetColumnKey) => boolean;
}
