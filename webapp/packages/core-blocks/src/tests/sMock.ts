/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

export function sMock(styles?: Record<string, string>, options?: Record<string, boolean>, ...inputs: (string | undefined)[]): string {
  const classes = [];

  if (options && styles) {
    Object.entries(options).forEach(([key, active]) => {
      if (active && styles[key]) {
        classes.push(styles[key]);
      }
    });
  }

  if (inputs.length) {
    classes.push(...inputs.filter(Boolean));
  }

  return classes.join(' ').trim();
}
