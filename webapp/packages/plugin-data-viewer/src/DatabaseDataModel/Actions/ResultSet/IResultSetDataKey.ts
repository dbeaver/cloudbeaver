/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

export interface IResultSetColumnKey {
  index: number;
}

export interface IResultSetRowKey {
  index: number;
  subIndex: number;
}

export interface IResultSetElementKey {
  readonly row: IResultSetRowKey;
  readonly column: IResultSetColumnKey;
}

export type IResultSetPartialKey = Partial<IResultSetElementKey>;
