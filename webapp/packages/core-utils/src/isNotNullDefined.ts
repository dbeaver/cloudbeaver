/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

export function isNotNullDefined<T>(obj: T | undefined | null): obj is T {
  return obj !== null && obj !== undefined;
}
