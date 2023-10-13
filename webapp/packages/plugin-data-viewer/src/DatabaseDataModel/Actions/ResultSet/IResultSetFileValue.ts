/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { IResultSetComplexValue } from './IResultSetComplexValue';

export interface IResultSetFileValue extends IResultSetComplexValue {
  $type: 'content';
  fileId?: string;
  contentType?: string;
  contentLength?: number;
}
