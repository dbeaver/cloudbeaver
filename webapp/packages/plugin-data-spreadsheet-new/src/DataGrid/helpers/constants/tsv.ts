/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

/** TSV format constants */
export const TSV = {
  /** Column separator */
  TAB: '\t',
  /** Row separator (Windows-style for clipboard compatibility) */
  ROW_SEPARATOR: '\r\n',
  /** Quote character for escaping special values */
  QUOTE: '"',
  /** Escaped quote (doubled) */
  ESCAPED_QUOTE: '""',
  /** Carriage return */
  CR: '\r',
  /** Line feed */
  LF: '\n',
} as const;

/** Regex to detect if a value needs quoting in TSV */
export const TSV_NEEDS_QUOTE_REGEX = /[\t\n\r"]/;

/** Regex to escape quotes (replace " with "") */
export const TSV_QUOTE_ESCAPE_REGEX = /"/g;
