/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { IAction } from './IAction';
import type { IActionInfo } from './IActionInfo';

const actionSymbol = Symbol('@action');

export function createAction(id: string, info: IActionInfo): IAction {
  const action: IAction = {
    id: `@action/${id}`,
    info,
  };

  (action as any)[actionSymbol] = true;

  return action;
}

export function isAction(obj: any): obj is IAction {
  return (
    obj
    && typeof obj === 'object'
    && actionSymbol in obj
  );
}
