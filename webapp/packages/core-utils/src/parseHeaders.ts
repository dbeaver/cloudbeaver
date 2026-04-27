/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

export function headersToText(headers: Record<string, string> | undefined): string | undefined {
  if (!headers || Object.keys(headers).length === 0) {
    return undefined;
  }
  return Object.entries(headers)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');
}

export function textToHeaders(text: string | undefined): Record<string, string> | undefined {
  if (!text?.trim()) {
    return undefined;
  }
  const headers: Record<string, string> = {};
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) {
      continue;
    }
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex > 0) {
      const key = trimmed.slice(0, eqIndex).trim();
      const value = trimmed.slice(eqIndex + 1).trim();
      if (key) {
        headers[key] = value;
      }
    }
  }
  return Object.keys(headers).length > 0 ? headers : undefined;
}
