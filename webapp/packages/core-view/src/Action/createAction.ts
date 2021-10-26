/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { IAction } from './IAction';
import type { IActionInfo } from './IActionInfo';

export function createAction(id: string, info: IActionInfo): IAction {
  return {
    id: `@action/${id}`,
    info,
  };
}
