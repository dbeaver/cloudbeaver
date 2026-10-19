/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { compile, literal, parse } from 'subscript';

// Load the JavaScript-expression preset, including single-quoted strings and literals.
import 'subscript/justin';

// Preserve the existing interpretation of null as an absent value.
literal('null', undefined);

interface IContext {
  object: Record<string, any>;
}

export function evaluate(expression: string, object: Record<string, any>): boolean {
  const fn = compile(parse(expression));
  const context: IContext = {
    object,
  };
  const result = fn(context);
  return !!result;
}
