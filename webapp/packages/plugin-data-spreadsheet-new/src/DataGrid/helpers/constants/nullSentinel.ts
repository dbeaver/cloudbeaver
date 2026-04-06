/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

/**
 * Unique sentinel for null values.
 * Uses Unicode Private Use Area characters (U+E000) which are clipboard-safe
 * and unlikely to appear in real data.
 */
export const NULL_SENTINEL = '\uE000NULL\uE000';

/** Check if a value represents the null sentinel */
export function isNullSentinel(value: string): boolean {
  return value === NULL_SENTINEL;
}
