/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { err, token, type AST, compile } from 'subscript';

const UNDEFINED_MAPPER_VALUE = new Array(2).fill(undefined, 1) as AST;
token('undefined', 20, a => (a ? err() : UNDEFINED_MAPPER_VALUE));
token('null', 20, a => (a ? err() : UNDEFINED_MAPPER_VALUE));

interface IContext {
  object: Record<string, any>;
}

export function evaluate(expression: string, object: Record<string, any>): boolean {
  const fn = compile(expression);
  const context: IContext = {
    object,
  };
  return fn(context);
}
