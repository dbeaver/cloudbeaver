/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { IResultSetComplexValue } from './IResultSetComplexValue';

export interface IResultSetGeometryValue extends IResultSetComplexValue {
  $type: 'geometry';
  srid: number;
  text: string;
  mapText: string | null;
  properties: Record<string, any> | null;
}
