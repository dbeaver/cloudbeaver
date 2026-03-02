/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
// @ts-nocheck
import justin from 'subscript/justin';

interface IContext {
  object: Record<string, any>;
}

export function evaluate(expression: string, object: Record<string, any>): boolean {
  const fn = justin(expression);
  const context: IContext = {
    object,
  };
  const result = fn(context);
  
  return !!result;
}
