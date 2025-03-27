/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { type ClassValue, clsx } from '@dbeaver/ui-kit';

export function s<T extends Record<string, string>>(styles: T, options?: Partial<Record<keyof T, boolean>>, ...inputs: ClassValue[]): string {
  return clsx(...Object.entries(options ?? {}).map(([key, active]) => active && styles[key]), ...inputs);
}
