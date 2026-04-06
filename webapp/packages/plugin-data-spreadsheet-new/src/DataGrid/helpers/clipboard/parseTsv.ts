/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { TSV } from '../constants/tsv.js';

const enum ParseState {
  FieldStart,
  InQuotedField,
  InUnquotedField,
}

/**
 * Parse TSV text (tab-separated, \r\n or \n line breaks) into a 2D string grid.
 * Supports quoted fields: values wrapped in double quotes can contain tabs,
 * newlines, and escaped double quotes ("").
 */
export function parseTsv(text: string): string[][] {
  if (!text) {
    return [];
  }

  const rows: string[][] = [];
  let currentRow: string[] = [];
  let field = '';
  let state = ParseState.FieldStart;

  const isNonEmptyRow = (row: string[]): boolean => row.some(f => f.length > 0);

  const finalizeField = (): void => {
    currentRow.push(field);
    field = '';
    state = ParseState.FieldStart;
  };

  const finalizeRow = (): void => {
    finalizeField();
    if (isNonEmptyRow(currentRow)) {
      rows.push(currentRow);
    }
    currentRow = [];
  };

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]!;
    const nextCh = text[i + 1];

    switch (state) {
      case ParseState.FieldStart:
        if (ch === TSV.QUOTE) {
          state = ParseState.InQuotedField;
        } else if (ch === TSV.TAB) {
          finalizeField();
        } else if (ch === TSV.CR && nextCh === TSV.LF) {
          finalizeRow();
          i++; // Skip the \n
        } else if (ch === TSV.LF) {
          finalizeRow();
        } else {
          field += ch;
          state = ParseState.InUnquotedField;
        }
        break;

      case ParseState.InQuotedField:
        if (ch === TSV.QUOTE) {
          if (nextCh === TSV.QUOTE) {
            // Escaped quote
            field += TSV.QUOTE;
            i++;
          } else {
            // End of quoted field
            state = ParseState.InUnquotedField;
          }
        } else {
          field += ch;
        }
        break;

      case ParseState.InUnquotedField:
        if (ch === TSV.TAB) {
          finalizeField();
        } else if (ch === TSV.CR && nextCh === TSV.LF) {
          finalizeRow();
          i++; // Skip the \n
        } else if (ch === TSV.LF) {
          finalizeRow();
        } else {
          field += ch;
        }
        break;
    }
  }

  // Finalize any remaining content
  finalizeField();
  if (isNonEmptyRow(currentRow)) {
    rows.push(currentRow);
  }

  return rows;
}
