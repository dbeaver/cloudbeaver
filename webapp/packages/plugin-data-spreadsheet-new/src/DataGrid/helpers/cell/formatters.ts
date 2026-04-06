/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { isResultSetContentValue, type IResultSetContentValue } from '@dbeaver/result-set-api';
import { isResultSetFileValue } from '@cloudbeaver/plugin-data-viewer';

import { NULL_SENTINEL } from '../constants/nullSentinel.js';
import type { ICellContext, ICellValueContext } from './types.js';

type ValueMatcher = (value: unknown) => boolean;
type ValueFormatter = (value: unknown, context: ICellContext) => string;

interface IValueFormatterEntry {
  matches: ValueMatcher;
  format: ValueFormatter;
}

/**
 * Ordered list of value formatters. First matching formatter wins.
 */
const VALUE_FORMATTERS: IValueFormatterEntry[] = [
  {
    matches: (v): v is null => v === null,
    format: () => NULL_SENTINEL,
  },
  {
    matches: (v): v is boolean => typeof v === 'boolean',
    format: v => String(v),
  },
  {
    matches: (v): v is number => typeof v === 'number',
    format: v => String(v),
  },
  {
    matches: (v): v is string => typeof v === 'string',
    format: v => v as string,
  },
  {
    matches: isResultSetContentValue,
    format: (v, { tableData, key }) => {
      const value = v as IResultSetContentValue;
      const fullText = tableData.dataContent.retrieveFullTextFromCache(key);
      if (fullText) {
        return fullText;
      }
      if (value.binary) {
        return value.binary;
      }
      return value.text ?? '';
    },
  },
  {
    matches: isResultSetFileValue,
    format: (_, { tableData, key }) => {
      const fullText = tableData.dataContent.retrieveFullTextFromCache(key);
      return fullText ?? '';
    },
  },
  {
    matches: (v): v is object => typeof v === 'object' && v !== null,
    format: v => JSON.stringify(v),
  },
];

/**
 * Format a cell value for clipboard export.
 * Handles various data types including null, primitives, content values, and objects.
 */
export function formatCellValueForClipboard(ctx: ICellValueContext): string {
  const context: ICellContext = { tableData: ctx.tableData, key: ctx.key };

  for (const { matches, format } of VALUE_FORMATTERS) {
    if (matches(ctx.value)) {
      return format(ctx.value, context);
    }
  }

  return String(ctx.value);
}
