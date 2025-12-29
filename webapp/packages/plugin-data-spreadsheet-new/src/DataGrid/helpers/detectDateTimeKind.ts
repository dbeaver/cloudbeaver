/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { DateTimeKind } from '../TableDataContext.js';

export function detectDateTimeKind(displayValue: string): DateTimeKind {
  if (/^\d{4}-\d{2}-\d{2}$/.test(displayValue)) {
    return DateTimeKind.DateOnly;
  }

  if (/^\d{2}:\d{2}:\d{2}/.test(displayValue) && !displayValue.includes('-')) {
    return DateTimeKind.TimeOnly;
  }

  return DateTimeKind.DateTime;
}
