/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { IResultSetContentValue } from './IResultSetContentValue.js';

export interface IResultSetBinaryValue extends IResultSetContentValue {
  binary: string;
}
