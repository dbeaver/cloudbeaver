/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { schema } from '@cloudbeaver/core-utils';

import type { IFormValidationContext } from './formValidationContext.js';

export function safeParseSchema<T>(zodSchema: schema.ZodType<T>, value: unknown, validation: IFormValidationContext): schema.ZodSafeParseResult<T> {
  const result = zodSchema.safeParse(value);

  if (!result.success) {
    const seenMessages = new Set<string>();
    for (const issue of result.error.issues) {
      const message = issue.message || schema.prettifyError(result.error);
      if (!seenMessages.has(message)) {
        seenMessages.add(message);
        validation.error(message);
      }
    }
  }

  return result;
}
