/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { ISqlDataSourceHistoryData } from './ISqlDataSourceHistoryData.js';

export function validateSqlDataSourceHistoryData(data: any): data is ISqlDataSourceHistoryData {
  return (
    Array.isArray(data) &&
    data.every(
      item => typeof item === 'object' && item !== null && typeof item.value === 'string' && ['string', 'undefined'].includes(typeof item.source),
    )
  );
}
