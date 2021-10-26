/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { IMenuContext } from '../Menu/IMenuContext';
import type { IViewContext } from '../View/IViewContext';
import type { IAction } from './IAction';
import type { IActionInfo } from './IActionInfo';

export interface IActionHandler {
  id: string;

  getActionInfo?: (context: IMenuContext, action: IAction) => IActionInfo;

  isActionApplicable: (context: IViewContext, action: IAction) => boolean;
  handler: (context: IViewContext, action: IAction) => void;
}
