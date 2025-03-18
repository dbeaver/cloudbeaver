/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import subscript from 'subscript';

const EXPRESSION_REGEXP = /\bobject\.([a-zA-Z_$][a-zA-Z0-9_$]*)\b/g;

interface IContext {
  object: Record<string, any>;
}

export function evaluate(expression: string, object: Record<string, any>) {
  const fn = subscript(expression);
  const matches = expression.matchAll(EXPRESSION_REGEXP);
  const context: IContext = {
    object: {},
  };

  for (const match of matches) {
    const id = match[1];

    if (id) {
      const value = object[id];
      context.object[id] = value;
    }
  }

  const result = fn(context);
  return result;
}
