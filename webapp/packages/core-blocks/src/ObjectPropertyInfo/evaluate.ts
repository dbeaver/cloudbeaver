/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import subscript from 'subscript';
import { err, token } from 'subscript/parse';

import 'subscript/feature/bool.js';

token('undefined', 20, a => (a ? err() : [, undefined]));
token('null', 20, a => (a ? err() : [, undefined]));

interface IContext {
  object: Record<string, any>;
}

export function evaluate(expression: string, object: Record<string, any>) {
  const fn = subscript(expression);
  const context: IContext = {
    object,
  };
  const result = fn(context);
  return result;
}
