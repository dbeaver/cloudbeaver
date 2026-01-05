/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { createContext } from 'react';

import type { IGridColumnKey } from '@cloudbeaver/plugin-data-viewer';

export enum DateTimeKind {
  DateTime = 'DATETIME',
  DateOnly = 'DATE',
  TimeOnly = 'TIME',
}

export interface IDataGridFormatters {
  locale: string;
  dateTime: Intl.DateTimeFormat;
  dateOnly: Intl.DateTimeFormat;
  number: Intl.NumberFormat;
}

export interface IFormattingContext {
  formatters: IDataGridFormatters | null;
  getExtendedDateKind: (columnKey: IGridColumnKey) => DateTimeKind;
}

export const FormattingContext = createContext<IFormattingContext>(undefined as any);
