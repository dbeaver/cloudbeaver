/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { DateTimeKind } from '../FormattingContext.js';

const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const TIME_ONLY_REGEX = /^\d{2}:\d{2}:\d{2}/;
const TIME_ONLY_NO_SECONDS_REGEX = /^\d{2}:\d{2}$/;

export function detectDateTimeKind(displayValue: string): DateTimeKind {
  if (DATE_ONLY_REGEX.test(displayValue)) {
    return DateTimeKind.DateOnly;
  }

  if ((TIME_ONLY_REGEX.test(displayValue) || TIME_ONLY_NO_SECONDS_REGEX.test(displayValue)) && !displayValue.includes('-')) {
    return DateTimeKind.TimeOnly;
  }

  return DateTimeKind.DateTime;
}
